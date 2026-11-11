using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;

sealed class LauncherRelease {
 public int revision {get;set;}
 public string path {get;set;}
 public int size {get;set;}
 public string sha256 {get;set;}
 public string signature {get;set;}
}
static class LauncherUpdates {
 public static readonly string[] Files={"ReturningWaters.exe","Microsoft.Web.WebView2.Core.dll","Microsoft.Web.WebView2.WinForms.dll","WebView2Loader.dll",
  "game/desktop.html","game/desktop.css","game/desktop.js","game/desktop-play.js","game/desktop-updates.js","game/asagi-title.jpg"};
 static readonly JavaScriptSerializer Json=new JavaScriptSerializer{MaxJsonLength=65536};
 public static string DataDirectory {
  get {return Environment.GetEnvironmentVariable("RETURNING_WATERS_DATA")??Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"ReturningWaters");}
 }
 public static string InstallDirectory {get;private set;}
 static bool activateAfterStartup;
 static string DirectoryFor(string data,int revision){return Path.Combine(data,"LauncherVersions",revision.ToString(CultureInfo.InvariantCulture));}
 static string Marker(string data){return Path.Combine(data,"launcher-release.txt");}
 static string Hex(byte[] hash){return BitConverter.ToString(hash).Replace("-","").ToLowerInvariant();}
 static string SignedText(LauncherRelease r){
  return r.revision.ToString(CultureInfo.InvariantCulture)+"\n"+r.path+"\n"+r.size.ToString(CultureInfo.InvariantCulture)+"\n"+r.sha256;
 }
 public static LauncherRelease Read(string raw){
  var r=Json.Deserialize<LauncherRelease>(raw);
  if(r==null||r.revision<1||r.path!="updates/launcher-"+r.revision.ToString(CultureInfo.InvariantCulture)+".zip"||
     r.size<1||r.size>24*1024*1024||r.sha256==null||!System.Text.RegularExpressions.Regex.IsMatch(r.sha256,@"\A[0-9a-f]{64}\z")||
     r.signature==null)throw new InvalidDataException("런처 배포 목록을 확인할 수 없습니다.");
  using(var rsa=new RSACryptoServiceProvider()){
   rsa.PersistKeyInCsp=false;rsa.FromXmlString(LauncherTrust.PublicKey);
   if(!rsa.VerifyData(Encoding.UTF8.GetBytes(SignedText(r)),CryptoConfig.MapNameToOID("SHA256"),Convert.FromBase64String(r.signature)))
    throw new InvalidDataException("런처 배포 서명이 맞지 않습니다.");
  }
  return r;
 }
 static void VerifyPayload(LauncherRelease r,byte[] bytes){
  using(var sha=SHA256.Create()){
   if(bytes.Length!=r.size||Hex(sha.ComputeHash(bytes))!=r.sha256)
    throw new InvalidDataException("런처 파일 검증에 실패했습니다.");
  }
 }
 static void VerifyArchive(string directory,byte[] bytes,bool extract){
  var expected=new HashSet<string>(Files,StringComparer.Ordinal);
  using(var stream=new MemoryStream(bytes,false))
  using(var archive=new ZipArchive(stream,ZipArchiveMode.Read)){
   foreach(var entry in archive.Entries){
    if(!expected.Remove(entry.FullName)||entry.Length<1||entry.Length>24*1024*1024)
     throw new InvalidDataException("런처 압축 파일에 예상하지 못한 파일이 있습니다.");
    var target=Path.Combine(directory,entry.FullName);
    if(extract){
     Directory.CreateDirectory(Path.GetDirectoryName(target));
     entry.ExtractToFile(target,false);
    }else{
     if(!File.Exists(target)||new FileInfo(target).Length!=entry.Length)throw new InvalidDataException("설치된 런처가 변경되었습니다.");
     using(var sha=SHA256.Create())
     using(var a=entry.Open())
     using(var b=File.OpenRead(target))
      if(!sha.ComputeHash(a).SequenceEqual(sha.ComputeHash(b)))throw new InvalidDataException("설치된 런처가 변경되었습니다.");
    }
   }
  }
  if(expected.Count!=0)throw new InvalidDataException("런처의 필수 파일이 빠졌습니다.");
 }
 static string VerifyInstalled(string data,int revision){
  var directory=DirectoryFor(data,revision);
  var r=Read(File.ReadAllText(Path.Combine(directory,"release.json")));
  if(r.revision!=revision)throw new InvalidDataException();
  var payload=Path.Combine(directory,"payload.zip");
  if(new FileInfo(payload).Length!=r.size)throw new InvalidDataException();
  var bytes=File.ReadAllBytes(payload);VerifyPayload(r,bytes);VerifyArchive(directory,bytes,false);
  return Path.Combine(directory,"ReturningWaters.exe");
 }
 public static string Install(string data,LauncherRelease release,byte[] bytes){
  VerifyPayload(release,bytes);
  var versions=Path.Combine(data,"LauncherVersions");Directory.CreateDirectory(versions);
  var target=DirectoryFor(data,release.revision);
  var stage=Path.Combine(versions,"pending-"+Guid.NewGuid().ToString("N"));Directory.CreateDirectory(stage);
  try{
   VerifyArchive(stage,bytes,true);
   File.WriteAllBytes(Path.Combine(stage,"payload.zip"),bytes);
   File.WriteAllText(Path.Combine(stage,"release.json"),Json.Serialize(release),new UTF8Encoding(false));
   if(Directory.Exists(target)){
    try{VerifyInstalled(data,release.revision);}
    catch{Directory.Move(target,target+"-invalid-"+Guid.NewGuid().ToString("N"));Directory.Move(stage,target);}
   }else Directory.Move(stage,target);
   return VerifyInstalled(data,release.revision);
  }finally{
   if(Directory.Exists(stage))try{Directory.Delete(stage,true);}catch(IOException){}catch(UnauthorizedAccessException){}
  }
 }
 public static void Activate(string data,int revision){
  string marker=Marker(data), temporary=marker+"."+Guid.NewGuid().ToString("N");
  File.WriteAllText(temporary,revision.ToString(CultureInfo.InvariantCulture),new UTF8Encoding(false));
  if(File.Exists(marker))File.Replace(temporary,marker,null);else File.Move(temporary,marker);
 }
 public static Process Launch(string path,bool activate=false){
  var args="--install-root \""+InstallDirectory.TrimEnd(Path.DirectorySeparatorChar)+"\" "+Process.GetCurrentProcess().Id+(activate?" activate":"");
  return Process.Start(new ProcessStartInfo(path,args){
   UseShellExecute=false,WorkingDirectory=Path.GetDirectoryName(path)
  });
 }
 public static bool Bootstrap(string[] args){
  InstallDirectory=AppDomain.CurrentDomain.BaseDirectory;
  if(args.Length>=3&&args[0]=="--install-root"&&Path.IsPathRooted(args[1])&&File.Exists(Path.Combine(args[1],"game","index.html"))){
   InstallDirectory=Path.GetFullPath(args[1]);
   int pid;
   if(Int32.TryParse(args[2],out pid)&&pid!=Process.GetCurrentProcess().Id)
    try{using(var previous=Process.GetProcessById(pid))previous.WaitForExit(15000);}catch(ArgumentException){}
   activateAfterStartup=args.Length==4&&args[3]=="activate";
  }
  if(File.Exists(Path.Combine(InstallDirectory,"game","program-only.flag")))return false;
  var data=DataDirectory;
  try{
   int revision;
   if(File.Exists(Marker(data))&&Int32.TryParse(File.ReadAllText(Marker(data)),out revision)&&revision>LauncherTrust.Revision){
    var path=VerifyInstalled(data,revision);
    using(var next=Launch(path))if(next!=null)return true;
   }
  }catch(Exception){}
  return false;
 }
 public static void CompleteActivation(){
  if(!activateAfterStartup)return;
  VerifyInstalled(DataDirectory,LauncherTrust.Revision);
  Activate(DataDirectory,LauncherTrust.Revision);
  activateAfterStartup=false;
 }
}
