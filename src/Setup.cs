using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;
using System.Runtime.InteropServices;
static class Setup {
 static Stream OpenPayload(){
  var assembly=Assembly.GetExecutingAssembly();
  return assembly.GetManifestResourceStream("ReturningWaters.Game")??File.OpenRead(assembly.Location);
 }
 static void InstallFiles(string root){
  Directory.CreateDirectory(root);
  using(var stream=OpenPayload())
  using(var zip=new ZipArchive(stream,ZipArchiveMode.Read)){
   foreach(var entry in zip.Entries){
    var path=Path.GetFullPath(Path.Combine(root,entry.FullName));
    if(!path.StartsWith(root+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new IOException("경로 오류");
    if(String.IsNullOrEmpty(entry.Name)){Directory.CreateDirectory(path);continue;}
    Directory.CreateDirectory(Path.GetDirectoryName(path));
    entry.ExtractToFile(path,true);
   }
  }
 }
 [STAThread] static void Main(){
  var root=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Programs","ReturningWaters");
  if(MessageBox.Show("돌아오는 물길을 설치할까요?\n\n"+root,"돌아오는 물길 설치",MessageBoxButtons.OKCancel)!=DialogResult.OK)return;
  try{
   InstallFiles(root);
   var link=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),"돌아오는 물길.lnk");
   var shell=Activator.CreateInstance(Type.GetTypeFromProgID("WScript.Shell"));
   var shortcut=shell.GetType().InvokeMember("CreateShortcut",BindingFlags.InvokeMethod,null,shell,new object[]{link});
   var exe=Path.Combine(root,"ReturningWaters.exe");
   shortcut.GetType().InvokeMember("TargetPath",BindingFlags.SetProperty,null,shortcut,new object[]{exe});
   shortcut.GetType().InvokeMember("WorkingDirectory",BindingFlags.SetProperty,null,shortcut,new object[]{root});
   shortcut.GetType().InvokeMember("Save",BindingFlags.InvokeMethod,null,shortcut,null);
   if(MessageBox.Show("설치가 끝났습니다. 게임을 실행할까요?","돌아오는 물길",MessageBoxButtons.YesNo)==DialogResult.Yes)
    System.Diagnostics.Process.Start(exe);
  }catch(Exception){MessageBox.Show("설치하지 못했습니다. 게임이 열려 있다면 닫은 뒤 다시 시도해 주세요.","돌아오는 물길");}
 }
}
