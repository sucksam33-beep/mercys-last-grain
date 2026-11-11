using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Windows.Forms;

static class CharacterGroomUpdate {
 static readonly string[] Files={"ResidentPortrait.mjs","ResidentCast.mjs","rigged-scene.mjs","CharacterGroom.mjs","updates/windows.json"};

 static string Digest(string path){
  if(!File.Exists(path))return "-";
  using(var input=File.OpenRead(path))using(var hash=SHA256.Create())
   return BitConverter.ToString(hash.ComputeHash(input)).Replace("-","").ToLowerInvariant();
 }

 static void Apply(string game){
  if(!File.Exists(Path.Combine(game,"program-only.flag")))
   throw new IOException("먼저 등장인물 목·손목 개선 Windows판을 설치해 주세요.");
  if(Process.GetProcessesByName("ReturningWaters").Any())
   throw new IOException("게임을 종료한 뒤 다시 실행해 주세요.");
  using(var resource=Assembly.GetExecutingAssembly().GetManifestResourceStream("ReturningWaters.Groom"))
  using(var zip=new ZipArchive(resource,ZipArchiveMode.Read)){
   string[] previous;
   using(var data=new StreamReader(zip.GetEntry("baseline.txt").Open()))
    previous=data.ReadToEnd().Trim().Split('\n').Select(line=>line.Trim()).ToArray();
   if(previous.Length!=Files.Length)throw new IOException("업데이트 패키지가 손상됐습니다.");
   var patch=Path.Combine(game,".groom-"+Guid.NewGuid().ToString("N"));
   Directory.CreateDirectory(patch);
   var changed=new List<int>();
   bool keepBackup=false;
   try {
    for(int i=0;i<Files.Length;i++){
     var entry=zip.GetEntry(Files[i]);
     if(entry==null)throw new IOException("업데이트 파일이 누락됐습니다.");
     var incoming=Path.Combine(patch,i+".incoming");
     entry.ExtractToFile(incoming);
     string current=Digest(Path.Combine(game,Files[i]));
     if(current==Digest(incoming))continue;
     if(!previous[i].Split(',').Contains(current))throw new IOException("설치 버전이 다릅니다. 목·손목 개선판 또는 첫 헤어 업데이트를 설치해 주세요.");
     changed.Add(i);
    }
    var committed=new List<int>();
    try {
     foreach(int i in changed){
      string target=Path.Combine(game,Files[i]), incoming=Path.Combine(patch,i+".incoming"), backup=Path.Combine(patch,i+".backup");
      if(File.Exists(target))File.Replace(incoming,target,backup);
      else File.Move(incoming,target);
      committed.Add(i);
     }
    } catch {
     foreach(int i in Enumerable.Reverse(committed)){
      var target=Path.Combine(game,Files[i]);
      var backup=Path.Combine(patch,i+".backup");
      try {
       if(File.Exists(backup))File.Replace(backup,target,null);
       else File.Delete(target);
      } catch {keepBackup=true;}
     }
     throw;
    }
   } finally {
    if(!keepBackup)try{Directory.Delete(patch,true);}catch(IOException){}
   }
  }
 }
 [STAThread] static void Main(){
  var game=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Programs","ReturningWaters","game");
  if(MessageBox.Show("돌아오는 물길 Windows판에 주민 헤어 업데이트를 적용할까요?","돌아오는 물길",MessageBoxButtons.OKCancel)!=DialogResult.OK)return;
  try {Apply(game);MessageBox.Show("주민 헤어 업데이트를 적용했습니다.","돌아오는 물길");}
  catch(Exception error){MessageBox.Show(error.Message,"업데이트 확인");}
 }
}
