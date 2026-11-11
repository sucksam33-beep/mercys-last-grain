using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;

sealed class ReleaseFile {
 public string path {get;set;}
 public string source {get;set;}
 public long size {get;set;}
 public string sha256 {get;set;}
}
sealed class GameRelease {
 public int schema {get;set;}
 public string version {get;set;}
 public long revision {get;set;}
 public string[] notes {get;set;}
 public ReleaseFile[] files {get;set;}
}
sealed class ContentUpdates : IDisposable {
 const string Manifest="updates/windows.json";
 static readonly Uri Site=new Uri("https://returning-waters-3d.sucksam33.chatgpt.site/");
 static readonly string[] LauncherFiles={"desktop.html","desktop.css","desktop.js","desktop-play.js","desktop-updates.js","asagi-title.jpg"};
 static readonly Regex Hash=new Regex(@"\A[0-9a-f]{64}\z",RegexOptions.CultureInvariant);
 static readonly Regex PathPattern=new Regex(@"\A[A-Za-z0-9_.-]+(/[A-Za-z0-9_.-]+)*\z",RegexOptions.CultureInvariant);
 readonly HttpClient http=new HttpClient(new HttpClientHandler{AllowAutoRedirect=false}){Timeout=TimeSpan.FromSeconds(12)};
 readonly string bundled,launcher,cache,pointer;
 readonly JavaScriptSerializer json=new JavaScriptSerializer{MaxJsonLength=1024*1024,RecursionLimit=20};
 static ContentUpdates(){
  ServicePointManager.SecurityProtocol=SecurityProtocolType.Tls12;
 }
 public string ContentPath {get;private set;}
 public bool LocalOnly {get;private set;}
 public GameRelease Current {get;private set;}
 public ContentUpdates(string bundled,string launcher,string data){
  this.bundled=bundled;this.launcher=launcher;cache=Path.Combine(data,"GameVersions");pointer=Path.Combine(data,"game-release.txt");
  ContentPath=bundled;Current=ReadManifest(bundled);
  LocalOnly=File.Exists(Path.Combine(bundled,"program-only.flag"));
  if(LocalOnly||!File.Exists(pointer))return;
  try {
   var id=File.ReadAllText(pointer).Trim();
   if(!Hash.IsMatch(id))return;
   var target=Path.Combine(cache,id);var release=ReadManifest(target);
   if(release!=null&&release.version==id&&release.revision>=(Current==null?0:Current.revision)&&File.Exists(Path.Combine(target,"index.html"))&&File.Exists(Path.Combine(target,"desktop.html"))){
    CopyLauncher(target);
    ContentPath=target;Current=release;
   }
  }catch(IOException){}catch(UnauthorizedAccessException){}
 }
 GameRelease ReadManifest(string directory){
  try {
   var file=Path.Combine(directory,Manifest);
   if(!File.Exists(file)||new FileInfo(file).Length>512*1024)return null;
   return Parse(File.ReadAllText(file));
  }catch(IOException){return null;}catch(UnauthorizedAccessException){return null;}catch(InvalidDataException){return null;}
 }
 GameRelease Parse(string raw){
  GameRelease m;
  try{m=json.Deserialize<GameRelease>(raw);}catch(ArgumentException){throw new InvalidDataException("잘못된 배포 목록입니다.");}catch(InvalidOperationException){throw new InvalidDataException("잘못된 배포 목록입니다.");}
  if(m==null||m.schema!=1||m.revision<=0||m.version==null||!Hash.IsMatch(m.version)||
     m.files==null||m.files.Length<2||m.files.Length>2048)throw new InvalidDataException("지원하지 않는 배포 목록입니다.");
  var seen=new HashSet<string>(StringComparer.OrdinalIgnoreCase);
  long total=0;
  foreach(var f in m.files){
   if(f==null||String.IsNullOrEmpty(f.path)||f.path.Length>200||!PathPattern.IsMatch(f.path)||
      f.path.Split('/').Any(p=>p=="."||p==".."||p.EndsWith(".")||Regex.IsMatch(p,@"\A(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|\z)",RegexOptions.IgnoreCase))||
      LauncherFiles.Contains(f.path,StringComparer.OrdinalIgnoreCase)||f.path.StartsWith("updates/",StringComparison.OrdinalIgnoreCase)||
      (f.source!=null&&(f.path!="index.html"||f.source!="updates/game-index.bin"))||
      !seen.Add(f.path)||f.size<0||f.size>128L*1024*1024||f.sha256==null||!Hash.IsMatch(f.sha256))
    throw new InvalidDataException("배포 목록에 잘못된 파일이 있습니다.");
   total+=f.size;
   if(total>512L*1024*1024)throw new InvalidDataException("배포 용량이 한도를 넘었습니다.");
  }
  if(!seen.Contains("index.html")||!seen.Contains("world.css"))throw new InvalidDataException("필수 게임 파일이 없습니다.");
  var canonical=String.Join("\n",m.files.OrderBy(f=>f.path,StringComparer.Ordinal).Select(f=>f.path+"\t"+f.size.ToString(System.Globalization.CultureInfo.InvariantCulture)+"\t"+f.sha256));
  using(var sha=SHA256.Create())
   if(Hex(sha.ComputeHash(Encoding.UTF8.GetBytes(canonical)))!=m.version)throw new InvalidDataException("배포 목록 검증에 실패했습니다.");
  return m;
 }
 static string Hex(byte[] bytes){return BitConverter.ToString(bytes).Replace("-","").ToLowerInvariant();}
 static bool Matches(string path,ReleaseFile file){
  if(!File.Exists(path)||new FileInfo(path).Length!=file.size)return false;
  using(var sha=SHA256.Create())using(var input=File.OpenRead(path))return Hex(sha.ComputeHash(input))==file.sha256;
 }
 async Task<byte[]> Get(string path,long max,CancellationToken token){
  using(var request=new HttpRequestMessage(HttpMethod.Get,new Uri(Site,path))){
   request.Headers.CacheControl=new System.Net.Http.Headers.CacheControlHeaderValue{NoCache=true};
   using(var response=await http.SendAsync(request,HttpCompletionOption.ResponseHeadersRead,token).ConfigureAwait(false)){
    response.EnsureSuccessStatusCode();
    if(response.Content.Headers.ContentLength>max)throw new InvalidDataException("응답 크기가 예상보다 큽니다.");
    using(var source=await response.Content.ReadAsStreamAsync().ConfigureAwait(false))
    using(var target=new MemoryStream()){
     var chunk=new byte[65536];
     for(int length;(length=await source.ReadAsync(chunk,0,chunk.Length,token).ConfigureAwait(false))>0;){
      if(target.Length+length>max)throw new InvalidDataException("응답 크기가 예상보다 큽니다.");
      target.Write(chunk,0,length);
     }
     return target.ToArray();
    }
   }
  }
 }
 public async Task<GameRelease> Check(){
  if(LocalOnly)return null;
  using(var limit=new CancellationTokenSource(TimeSpan.FromSeconds(12))){
   var raw=Encoding.UTF8.GetString(await Get(Manifest,512*1024,limit.Token).ConfigureAwait(false));
   var next=Parse(raw);
   if(Current!=null&&(next.version==Current.version||next.revision<=Current.revision))return null;
   return next;
  }
 }
 public async Task<LauncherRelease> CheckLauncher(){
  if(LocalOnly)return null;
  using(var limit=new CancellationTokenSource(TimeSpan.FromSeconds(12))){
   try{
    var release=LauncherUpdates.Read(Encoding.UTF8.GetString(await Get("updates/launcher.json",65536,limit.Token).ConfigureAwait(false)));
    return release.revision>LauncherTrust.Revision?release:null;
   }catch(HttpRequestException){return null;}
  }
 }
 public async Task<string> StageLauncher(LauncherRelease release,string data){
  using(var limit=new CancellationTokenSource(TimeSpan.FromSeconds(75))){
   var bytes=await Get(release.path+"?rw="+release.sha256,release.size,limit.Token).ConfigureAwait(false);
   return LauncherUpdates.Install(data,release,bytes);
  }
 }
 public async Task PrepareLauncherContent(IProgress<int> progress){
  if(ContentPath==bundled&&Current!=null)await Apply(Current,progress).ConfigureAwait(false);
 }
 void CopyLauncher(string target){
  foreach(var file in LauncherFiles)File.Copy(Path.Combine(launcher,file),Path.Combine(target,file),true);
 }
 public async Task Apply(GameRelease release,IProgress<int> progress){
  Directory.CreateDirectory(cache);
  string stage=Path.Combine(cache,"pending-"+Guid.NewGuid().ToString("N")),target=Path.Combine(cache,release.version);
  Directory.CreateDirectory(stage);
  try {
   for(int i=0;i<release.files.Length;i++){
    var file=release.files[i];
    var to=Path.Combine(stage,file.path);Directory.CreateDirectory(Path.GetDirectoryName(to));
    var current=Path.Combine(ContentPath,file.path);
    if(Matches(current,file))File.Copy(current,to);
    else {
     using(var limit=new CancellationTokenSource(TimeSpan.FromSeconds(45))){
      var bytes=await Get((file.source??file.path)+"?rw="+release.version,file.size,limit.Token).ConfigureAwait(false);
      using(var sha=SHA256.Create())
       if(bytes.LongLength!=file.size||Hex(sha.ComputeHash(bytes))!=file.sha256)
        throw new InvalidDataException("다운로드한 게임 파일 검증에 실패했습니다.");
      File.WriteAllBytes(to,bytes);
     }
    }
    progress.Report((i+1)*100/release.files.Length);
   }
   CopyLauncher(stage);
   Directory.CreateDirectory(Path.Combine(stage,"updates"));
   File.WriteAllText(Path.Combine(stage,Manifest),json.Serialize(release),new UTF8Encoding(false));
   if(Directory.Exists(target)){
    var cached=ReadManifest(target);
    if(release.files.All(f=>Matches(Path.Combine(target,f.path),f))&&File.Exists(Path.Combine(target,"desktop.html"))&&cached!=null&&cached.version==release.version){
     CopyLauncher(target);
     Directory.Delete(stage,true);
    }else{
     Directory.Move(target,target+"-invalid-"+Guid.NewGuid().ToString("N"));
     Directory.Move(stage,target);
    }
   }else Directory.Move(stage,target);
   var temporary=pointer+"."+Guid.NewGuid().ToString("N");
   File.WriteAllText(temporary,release.version,new UTF8Encoding(false));
   if(File.Exists(pointer))File.Replace(temporary,pointer,null);else File.Move(temporary,pointer);
   Current=release;ContentPath=target;
  }finally{
   if(Directory.Exists(stage))try{Directory.Delete(stage,true);}catch(IOException){}catch(UnauthorizedAccessException){}
  }
 }
 public void Dispose(){http.Dispose();}
}
