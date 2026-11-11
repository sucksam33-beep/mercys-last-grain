using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

static class Program {
 [STAThread] static void Main(string[] args) {
  if(LauncherUpdates.Bootstrap(args))return;
  Application.EnableVisualStyles();
  Application.SetCompatibleTextRenderingDefault(false);
  Application.Run(new GameWindow());
 }
}
sealed class Profile {
 public string Nick {get;set;}
 public string Salt {get;set;}
 public string Hash {get;set;}
 public string SessionHash {get;set;}
 public DateTime? SessionExpiresUtc {get;set;}
}
sealed class GameWindow : Form {
 readonly string data = Environment.GetEnvironmentVariable("RETURNING_WATERS_DATA") ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"ReturningWaters");
 readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength=2*1024*1024,RecursionLimit=40 };
 readonly WebView2 view = new WebView2 {Dock=DockStyle.Fill};
 readonly ContentUpdates updates;
 GameRelease pendingUpdate;
 LauncherRelease pendingLauncher;
 string updatePhase="initial",updateMessage="";
 int updateProgress;
 const string origin="https://game.returningwaters.local";
 const string saveKey="returning-waters-v1";
 Dictionary<string,Profile> profiles = new Dictionary<string,Profile>();
 string active;
 string scriptId;
 bool inGame;
 bool authBusy, starting, fullscreen, gameReady;
 string pendingSave, lastLaunch, titleNotice;
 FormWindowState windowedState;
 Rectangle windowedBounds;
 Task restore;
 readonly Timer loadTimer=new Timer {Interval=120000};
 readonly System.Diagnostics.Stopwatch clock=System.Diagnostics.Stopwatch.StartNew();
 long launchAt;
 static readonly string[] Locations={"아사기","브뤼넨","산타 루시아","주니퍼웰","비버턴","생오렐","암바로","카루크"};
 string FileAt(string name) { return Path.Combine(data,name); }
 string SavePath(string id) {return FileAt("save-"+id+".json");}
 string ManualSavePath(string id) {return FileAt("manual-"+id+".json");}
 static bool ValidId(string id) {return id!=null&&Regex.IsMatch(id,@"\A[A-Za-z0-9_]{3,24}\z");}
 static byte[] RandomBytes(int count) {var bytes=new byte[count];using(var rng=RandomNumberGenerator.Create())rng.GetBytes(bytes);return bytes;}
 static string Digest(byte[] token) {using(var sha=SHA256.Create())return Convert.ToBase64String(sha.ComputeHash(token));}
 static bool Same(string a,string b) {
  if(a==null||b==null||a.Length!=b.Length)return false;
  var delta=0;for(var i=0;i<a.Length;i++)delta|=a[i]^b[i];return delta==0;
 }
 static string Password(string password,byte[] salt) {
  using(var kdf=new Rfc2898DeriveBytes(password,salt,600000,HashAlgorithmName.SHA256))
   return Convert.ToBase64String(kdf.GetBytes(32));
 }
 static void WriteAtomic(string path,string text) {
  WriteAtomic(path,new UTF8Encoding(false).GetBytes(text));
 }
 static void WriteAtomic(string path,byte[] bytes) {
  var temp=path+".pending";File.WriteAllBytes(temp,bytes);
  if(File.Exists(path))File.Replace(temp,path,null);else File.Move(temp,path);
 }
 void StoreProfiles(){WriteAtomic(FileAt("accounts.json"),json.Serialize(profiles));}
 Task LoadProfiles(){
  return Task.Run(()=>{
   var path=FileAt("accounts.json");
   if(File.Exists(path))profiles=new JavaScriptSerializer().Deserialize<Dictionary<string,Profile>>(File.ReadAllText(path))??new Dictionary<string,Profile>();
   active=RestoreSession();
   if(active==null&&File.Exists(FileAt("session.dat")))titleNotice="로그인 세션이 만료됐습니다. 다시 로그인해 주세요.";
  });
 }
 public GameWindow(){
  updates=new ContentUpdates(Path.Combine(LauncherUpdates.InstallDirectory,"game"),Path.Combine(AppDomain.CurrentDomain.BaseDirectory,"game"),data);
  Text="Mercy’s Last Grain"; ClientSize=new Size(1280,800);MinimumSize=new Size(840,560);
  BackColor=Color.FromArgb(21,27,25);
  Icon=Icon.ExtractAssociatedIcon(Application.ExecutablePath);Controls.Add(view);
  loadTimer.Tick+=(o,e)=>ReturnToTitle("게임을 불러오는 시간이 초과됐습니다.",true);
  FormClosed+=(o,e)=>{loadTimer.Dispose();updates.Dispose();};
  Shown+=async (sender,args)=>{
   try {
    Directory.CreateDirectory(data);
    var options=new CoreWebView2EnvironmentOptions("--autoplay-policy=no-user-gesture-required");
    var env=await CoreWebView2Environment.CreateAsync(null,FileAt("WebView2"),options);
    await view.EnsureCoreWebView2Async(env);
    var web=view.CoreWebView2;
    MapContent();
    web.Settings.AreDevToolsEnabled=false;web.Settings.AreDefaultContextMenusEnabled=false;
    web.NavigationStarting+=(o,e)=>{Uri u;if(!Uri.TryCreate(e.Uri,UriKind.Absolute,out u)||u.Scheme!="https"||u.Host!="game.returningwaters.local")e.Cancel=true;};
    web.NewWindowRequested+=(o,e)=>e.Handled=true;
    web.WebMessageReceived+=HandleMessage;
    web.NavigationCompleted+=(o,e)=>{if(starting&&!e.IsSuccess)ReturnToTitle("게임 화면을 열지 못했습니다.",true);};
    restore=LoadProfiles();
    web.Navigate(origin+"/desktop.html");
   }catch(Exception e){MessageBox.Show("게임 창을 시작하지 못했습니다. WebView2 런타임과 설치 파일을 확인해 주세요.\n"+e.GetType().Name,"Mercy’s Last Grain");Close();}
  };
 }
 string RestoreSession(){
  try {
   var protectedBytes=File.ReadAllBytes(FileAt("session.dat"));
   var values=Encoding.UTF8.GetString(ProtectedData.Unprotect(protectedBytes,null,DataProtectionScope.CurrentUser)).Split(':');
   Profile p;
   if(values.Length==2&&ValidId(values[0])&&profiles.TryGetValue(values[0],out p)&&
      (!p.SessionExpiresUtc.HasValue||p.SessionExpiresUtc.Value.ToUniversalTime()>DateTime.UtcNow)&&
      Same(p.SessionHash,Digest(Convert.FromBase64String(values[1]))))return values[0];
  }catch(IOException){}catch(CryptographicException){}catch(FormatException){}
  return null;
 }
 void CreateSession(string id){
  var token=RandomBytes(32);
  var bytes=ProtectedData.Protect(Encoding.UTF8.GetBytes(id+":"+Convert.ToBase64String(token)),null,DataProtectionScope.CurrentUser);
  profiles[id].SessionHash=Digest(token);
  profiles[id].SessionExpiresUtc=DateTime.UtcNow.AddDays(30);
  StoreProfiles();
  WriteAtomic(FileAt("session.dat"),bytes);active=id;
 }
 void Send(object value){view.CoreWebView2.PostWebMessageAsJson(json.Serialize(value));}
 void MapContent(){
  view.CoreWebView2.SetVirtualHostNameToFolderMapping("game.returningwaters.local",updates.ContentPath,CoreWebView2HostResourceAccessKind.Deny);
 }
 void UpdateState(){
  var current=updates.Current;
  Send(new {type="update",phase=updatePhase,message=updateMessage,progress=updateProgress,
   version=current==null?null:current.version.Substring(0,8),launcherRevision=LauncherTrust.Revision,
   notes=(pendingLauncher==null?new string[0]:new[]{"Windows 런처 업데이트 · 설치 후 자동으로 다시 시작됩니다."})
    .Concat(pendingUpdate==null||pendingUpdate.notes==null?new string[0]:pendingUpdate.notes).ToArray()});
 }
 async Task CheckUpdate(){
  if(updatePhase=="checking"||updatePhase=="downloading"||inGame)return;
  if(updates.LocalOnly){
   updatePhase="current";updateMessage="Windows 전용 빌드입니다. 새 버전은 설치 파일로 적용합니다.";UpdateState();return;
  }
  updatePhase="checking";updateMessage="새 버전을 확인하고 있습니다.";UpdateState();
  try{
   var game=updates.Check();
   var launcher=updates.CheckLauncher();
   var gameCheckFailed=false;
   try{pendingUpdate=await game;}catch{pendingUpdate=null;gameCheckFailed=true;}
   pendingLauncher=await launcher;
   if(gameCheckFailed&&pendingLauncher==null)throw new IOException("게임 업데이트 목록을 확인하지 못했습니다.");
   updatePhase=pendingUpdate==null&&pendingLauncher==null?"current":"available";
   updateMessage=updatePhase=="current"?"최신 버전입니다.":pendingLauncher!=null?"새 Windows 런처 버전이 있습니다.":"새 게임 버전이 있습니다.";
  }catch(Exception){
   pendingUpdate=null;pendingLauncher=null;updatePhase="offline";updateMessage="업데이트 서버에 연결하지 못했습니다. 현재 버전으로 실행할 수 있습니다.";
  }
  if(!IsDisposed)UpdateState();
 }
 async Task InstallUpdate(){
  if((pendingUpdate==null&&pendingLauncher==null)||inGame||updatePhase=="checking"||updatePhase=="downloading")return;
  updateProgress=0;updatePhase="downloading";updateMessage="업데이트 파일을 확인하고 있습니다.";UpdateState();
  try{
   var progress=new Progress<int>(value=>{
    if(IsDisposed||updatePhase!="downloading")return;
    updateProgress=value;UpdateState();
   });
   if(pendingUpdate!=null)await Task.Run(()=>updates.Apply(pendingUpdate,progress));
   if(pendingLauncher!=null){
    var release=pendingLauncher;
    updateMessage="Windows 런처를 설치하고 있습니다.";UpdateState();
    var next=await Task.Run(async ()=>{
     await updates.PrepareLauncherContent(progress);
     return await updates.StageLauncher(release,data);
    });
    if(IsDisposed)return;
    using(var process=LauncherUpdates.Launch(next,true)){
     if(process==null)throw new IOException("새 런처를 열지 못했습니다.");
    }
    Close();
    return;
   }
   if(IsDisposed)return;
   MapContent();
   await view.CoreWebView2.Profile.ClearBrowsingDataAsync(CoreWebView2BrowsingDataKinds.DiskCache);
   pendingUpdate=null;updatePhase="complete";updateMessage="업데이트가 완료됐습니다. 게임을 실행할 수 있습니다.";
  }catch(Exception){
   updatePhase="failed";updateMessage="업데이트를 완료하지 못했습니다. 다시 시도하거나 현재 버전으로 실행할 수 있습니다.";
  }
  if(!IsDisposed)UpdateState();
 }
 void Trace(string label,long elapsed){
  if(Environment.GetEnvironmentVariable("RETURNING_WATERS_QA")!="1")return;
  File.AppendAllText(FileAt("timings.log"),label+" "+elapsed+Environment.NewLine);
 }
 void State(){
  var path=active==null?null:SavePath(active);
  var hasFile=path!=null&&File.Exists(path);
  var save=hasFile?ParseSave(File.ReadAllText(path)):null;
  Send(new {type="state",nickname=active==null?null:profiles[active].Nick,saved=save!=null,hasFile,
   location=save==null?null:Locations[(int)save["region"]],day=save==null?null:save["day"],
   fullscreen,notice=titleNotice,retry=lastLaunch});
  titleNotice=null;
 }
 void Error(string message,string field=null){Send(new {type="error",message,field});}
 Dictionary<string,object> ParseSave(string text){
  if(String.IsNullOrEmpty(text)||text.Length>1024*1024)return null;
  try {
   var v=json.DeserializeObject(text) as Dictionary<string,object>;
   if(v==null||!v.ContainsKey("region")||!(v["region"] is int)||(int)v["region"]<0||(int)v["region"]>7)return null;
   foreach(var key in new[]{"bag","homes"})if(!v.ContainsKey(key)||!(v[key] is Dictionary<string,object>))return null;
   if(!v.ContainsKey("log")||!(v["log"] is object[]))return null;
   foreach(var key in new[]{"day","hour","energy","coins","stage","side"}){
    if(!v.ContainsKey(key)||!(v[key] is int||v[key] is decimal||v[key] is double))return null;
   }
   if(Convert.ToDouble(v["day"])<1||Convert.ToDouble(v["stage"])<0||Convert.ToDouble(v["stage"])>6)return null;
   return v;
  }catch(ArgumentException){return null;}catch(InvalidOperationException){return null;}
 }
 void SetFullscreen(bool value){
  if(fullscreen==value)return;
  fullscreen=value;
  if(value){
   windowedState=WindowState;windowedBounds=WindowState==FormWindowState.Normal?Bounds:RestoreBounds;
   var screen=Screen.FromControl(this);
   WindowState=FormWindowState.Normal;FormBorderStyle=FormBorderStyle.None;Bounds=screen.Bounds;
  }else{
   FormBorderStyle=FormBorderStyle.Sizable;Bounds=windowedBounds;WindowState=windowedState;
  }
 }
 void ReturnToTitle(string message=null,bool retry=false){
  loadTimer.Stop();
  if(!retry)lastLaunch=null;
  inGame=starting=gameReady=false;pendingSave=null;titleNotice=message;
  if(scriptId!=null){view.CoreWebView2.RemoveScriptToExecuteOnDocumentCreated(scriptId);scriptId=null;}
  view.CoreWebView2.Navigate(origin+"/desktop.html");
 }
 async Task StartGame(string mode,bool confirmed){
  if(updatePhase=="initial"||updatePhase=="checking"||updatePhase=="available"||updatePhase=="downloading"){
   UpdateState();Error("업데이트 확인 또는 설치가 끝난 뒤 게임을 실행해 주세요.");return;
  }
  var path=SavePath(active);
  var exists=File.Exists(path);
  var save=exists?File.ReadAllText(path):null;
  if(mode=="continue"&&ParseSave(save)==null){Error("이어서 플레이할 수 있는 저장이 없습니다.");return;}
  if(mode=="new"&&exists&&!confirmed){Send(new {type="confirmNew"});return;}
  if(mode=="new"&&exists)File.Copy(path,path+".before-new-"+DateTime.UtcNow.Ticks+".bak");
  var value=Convert.ToBase64String(Encoding.UTF8.GetBytes(mode=="continue"?save:""));
  var script="if(location.pathname==='/index.html'){window.desktopLaunchMode='"+mode+"';window.desktopFullscreen="+(fullscreen?"true":"false")+";const k='"+saveKey+"';const v='"+value+"';"+
   "if(v){const s=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(v),c=>c.charCodeAt(0))));s.introPending=false;localStorage.setItem(k,JSON.stringify(s));}else localStorage.removeItem(k);"+
   "const put=Storage.prototype.setItem;Storage.prototype.setItem=function(n,d){put.call(this,n,d);if(this===localStorage&&n===k)chrome.webview.postMessage({op:'save',data:d});};"+
   "addEventListener('DOMContentLoaded',()=>{const css=document.createElement('link');css.rel='stylesheet';css.href='desktop.css';document.head.append(css);const bridge=document.createElement('script');bridge.src='desktop-play.js';document.body.append(bridge);});}";
  starting=true;gameReady=false;pendingSave=null;lastLaunch=mode;launchAt=clock.ElapsedMilliseconds;
  Send(new {type="loading",mode});
  try{
   scriptId=await view.CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync(script);
   inGame=true;loadTimer.Start();
   view.CoreWebView2.Navigate(origin+"/index.html");
  }catch{ReturnToTitle("게임 화면을 열지 못했습니다.",true);}
 }
 async Task Authenticate(string op,string id,string password,string nick){
  if(!ValidId(id)){Error("영문·숫자·밑줄 3~24자를 입력해 주세요.","id");return;}
  if(password.Length<8||password.Length>128){Error("비밀번호를 8~128자로 입력해 주세요.","password");return;}
  Profile profile;
  if(op=="register"){
   if(nick.Length<1||nick.Length>24||Regex.IsMatch(nick,@"\p{C}")){Error("닉네임을 1~24자로 입력해 주세요.","nickname");return;}
   if(profiles.ContainsKey(id)){Error("이 기기에 이미 등록된 아이디입니다.","id");return;}
   var salt=RandomBytes(24);
   var hash=await Task.Run(()=>Password(password,salt));
   profiles.Add(id,new Profile{Nick=nick,Salt=Convert.ToBase64String(salt),Hash=hash});
  }else{
   if(!profiles.TryGetValue(id,out profile)){Error("아이디 또는 비밀번호가 맞지 않습니다.","password");return;}
   var hash=await Task.Run(()=>Password(password,Convert.FromBase64String(profile.Salt)));
   if(!Same(profile.Hash,hash)){Error("아이디 또는 비밀번호가 맞지 않습니다.","password");return;}
  }
  CreateSession(id);lastLaunch=null;State();
 }
 async void HandleMessage(object sender, CoreWebView2WebMessageReceivedEventArgs e){
  var title=e.Source==origin+"/desktop.html";
  if(!title&&e.Source!=origin+"/index.html")return;
  try {
   var msg=json.Deserialize<Dictionary<string,object>>(e.WebMessageAsJson);
   Func<string,string> get=key=>msg.ContainsKey(key)?msg[key] as string:null;
   Func<string,bool> flag=key=>msg.ContainsKey(key)&&msg[key] is bool&&(bool)msg[key];
   var op=get("op");
   if(title&&op=="updateState"){
    if(updatePhase=="initial")await CheckUpdate();else UpdateState();
    return;
   }
   if(title&&op=="checkUpdate"){await CheckUpdate();return;}
   if(title&&op=="applyUpdate"){await InstallUpdate();return;}
   if(title&&op=="titleReady"){LauncherUpdates.CompleteActivation();Trace("title",clock.ElapsedMilliseconds);return;}
   if(title&&op=="exit"){Close();return;}
   if(title&&op=="fullscreen"){SetFullscreen(flag("value"));return;}
   if(!title){
    if(!inGame||active==null)return;
    if(op=="fullscreen"){SetFullscreen(flag("value"));Send(new {type="fullscreen",value=fullscreen});return;}
    if(op=="title"){ReturnToTitle();return;}
    if(op=="gameExit"){Close();return;}
    if(op=="manualSave"&&gameReady){
     var manual=get("data");
     if(ParseSave(manual)==null){Send(new {type="manualSave",ok=false,message="현재 상태를 저장할 수 없습니다."});return;}
     try{
      WriteAtomic(ManualSavePath(active),manual);
      Send(new {type="manualSave",ok=true,message="수동 저장을 완료했습니다."});
     }catch(IOException){Send(new {type="manualSave",ok=false,message="저장 파일을 쓸 수 없습니다."});}
     catch(UnauthorizedAccessException){Send(new {type="manualSave",ok=false,message="저장 폴더에 접근할 수 없습니다."});}
     return;
    }
    if(op=="manualLoad"&&gameReady){
     var path=ManualSavePath(active);
     try{
      var manual=File.Exists(path)?ParseSave(File.ReadAllText(path)):null;
      Send(new {type="manualLoad",save=manual,message=manual==null?"불러올 수 있는 수동 저장이 없습니다.":null});
     }catch(IOException){Send(new {type="manualLoad",message="저장 파일을 읽을 수 없습니다."});}
     catch(UnauthorizedAccessException){Send(new {type="manualLoad",message="저장 폴더에 접근할 수 없습니다."});}
     return;
    }
    if(op=="gameError"&&starting){ReturnToTitle("게임을 불러오지 못했습니다. 다시 시도해 주세요.",true);return;}
    if(op=="gameReady"&&starting){
     if(pendingSave!=null)WriteAtomic(SavePath(active),pendingSave);
     pendingSave=null;starting=false;gameReady=true;loadTimer.Stop();lastLaunch=null;
    }
    if(op=="controlReady"&&gameReady)Trace("control",clock.ElapsedMilliseconds-launchAt);
    if(op=="save"){
     var save=get("data");
     if(ParseSave(save)==null)return;
     if(starting)pendingSave=save;
     else if(gameReady)WriteAtomic(SavePath(active),save);
    }
    return;
   }
   if(op=="state"&&restore.IsFaulted)restore=LoadProfiles();
   await restore;
   if(op=="state"){State();return;}
   if(authBusy||starting)return;
   if(op=="register"||op=="login"){
    if(active!=null){State();return;}
    authBusy=true;
    try{await Authenticate(op,(get("id")??"").ToLowerInvariant(),get("password")??"",(get("nickname")??"").Trim());}
    finally{authBusy=false;}
    return;
   }
   if(active==null){Error("먼저 로그인해 주세요.");return;}
   if(op=="logout"||op=="switch"){
    profiles[active].SessionHash=null;profiles[active].SessionExpiresUtc=null;StoreProfiles();
    File.Delete(FileAt("session.dat"));active=null;lastLaunch=null;State();return;
   }
   if(op=="import"){
    var save=get("data");
    if(ParseSave(save)==null){Error("Mercy’s Last Grain의 저장 파일 형식이 아닙니다.");return;}
    var path=SavePath(active);
    if(File.Exists(path))File.Copy(path,path+".before-import-"+DateTime.UtcNow.Ticks+".bak");
    WriteAtomic(path+".import-"+DateTime.UtcNow.Ticks+".bak",save);WriteAtomic(path,save);State();return;
   }
   if(op=="new"||op=="continue")await StartGame(op,flag("confirmed"));
  }catch(Exception){
   if(!title&&starting)ReturnToTitle("게임 또는 저장 파일을 불러오지 못했습니다.",true);
   else if(title)Error("요청을 처리하지 못했습니다. 저장 공간과 입력 내용을 확인해 주세요.");
  }
 }
}
