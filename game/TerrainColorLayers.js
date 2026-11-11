const groundPalette=[
 ["#8a7c61","#79874e","#a69778"],["#8e805e","#74804d","#a6997f"],
 ["#a57752","#9a8058","#bf996b"],["#8b6a4d","#747c52","#a98a66"],
 ["#84735d","#748653","#a29578"],["#655e48","#66764e","#918367"],
 ["#98835d","#78834e","#b9a681"],["#8e9699","#c1c8c6","#a7aba3"]
];
let preparedGroundPalette;
function sandTerrainColor(x,z,base,gravel,path,roadDistance,riverDistance){
 preparedGroundPalette??=groundPalette.map(row=>row.map(color));
 const [soil,cover,trail]=preparedGroundPalette[s.region];
 const brush=(low,high,value)=>{
  const weight=cap((value-low)/(high-low),0,1);
  return weight*weight*(3-2*weight);
 };
 const broad=Math.sin(x*.048+z*.023)*Math.cos(z*.036-x*.017);
 const flecks=Math.sin(x*.147-z*.19)*Math.cos(z*.14+x*.092);
 const edge=broad*1.28+flecks*.46;
 const foliage=brush(-.74,.62,broad+flecks*.19);
 const ground=mix(base,mix(soil,cover,foliage),.56);
 const road=1-brush(2.3,11.9,roadDistance+edge);
 const shore=1-brush(11.8,25,riverDistance+edge*.85);
 const riverbank=mix(gravel,soil,s.region===5?.67:.33);
 return mix(mix(ground,mix(path,trail,.66),road),riverbank,shore*.91);
}
