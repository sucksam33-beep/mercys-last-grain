"use strict";
function displayText(text){
 return text.replace(/[ \t]*[·・‧∙⋅][ \t]*/g," ");
}
{
 const root=document.documentElement;
 const attributes=["title","aria-label","placeholder","alt"];
 const ignored="script,style,textarea,noscript";
 const normalizeAttribute=(node,name)=>{
  const raw=node.getAttribute(name);
  if(raw===null)return;
  const cleaned=displayText(raw);
  if(raw!==cleaned)node.setAttribute(name,cleaned);
 };
 function normalizeNode(node){
  if(node.nodeType===Node.TEXT_NODE){
   const cleaned=displayText(node.data);
   if(cleaned!==node.data)node.data=cleaned;
  }else for(const name of attributes)normalizeAttribute(node,name);
 }
 function normalizeTree(node){
  const element=node.nodeType===Node.ELEMENT_NODE?node:node.parentElement;
  if(element?.closest(ignored))return;
  if(node.nodeType===Node.TEXT_NODE){normalizeNode(node);return;}
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  normalizeNode(node);
  const tree=document.createTreeWalker(node,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode:child=>
   child.nodeType===Node.ELEMENT_NODE&&child.matches(ignored)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
  for(let child=tree.nextNode();child;child=tree.nextNode())normalizeNode(child);
 }
 const observer=new MutationObserver(changes=>{
  for(const change of changes){
   if(!change.target.isConnected)continue;
   if(change.type==="attributes")normalizeAttribute(change.target,change.attributeName);
   else if(change.type==="characterData")normalizeTree(change.target);
   else for(const node of change.addedNodes)if(node.isConnected)normalizeTree(node);
  }
 });
 observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes});
 normalizeTree(root);
}
