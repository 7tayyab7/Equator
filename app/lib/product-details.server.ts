import {parseDocument} from 'htmlparser2';
type AnyNode=ReturnType<typeof parseDocument>|ReturnType<typeof parseDocument>['children'][number];
import {textContent,getOuterHTML} from 'domutils';
export type DetailRow={label:string;value:string};
const labels='Fabric|Material|Composition|Fit|Colou?r|Pattern|Style|Sleeve(?: Length)?|Collar(?: Style)?|Neck(?:line)?|Length|Occasion|Design';
const entry=new RegExp(`^(${labels})\\s*:\\s*(.+)$`,'i');
function row(text:string):DetailRow|null {const match=text.replace(/\u00a0/g,' ').trim().match(entry);return match?{label:match[1].toLowerCase().replace(/^color$/,'colour').replace(/\b\w/g,c=>c.toUpperCase()),value:match[2].trim()}:null;}
export function parseDetails(value:string):DetailRow[]{return value.split(/\r?\n/).map(text=>text.trim()).filter(Boolean).map(text=>{const index=text.indexOf(':');return index>0&&index<60?{label:text.slice(0,index).trim(),value:text.slice(index+1).trim()}:{label:'',value:text};}).filter(item=>item.value);}
export function splitProductDetails(html:string){
 const document=parseDocument(html),details:DetailRow[]=[];let line:AnyNode[]=[];
 function flush(){if(!line.length)return;const found=row(line.map(textContent).join(''));if(found){details.push(found);for(const node of line)if(node.type==='text')node.data='';}line=[];}
 function visit(node:AnyNode){if(node.type==='text'){line.push(node);return;}if('name'in node&&/^(br|p|li|div|h[1-6]|tr|td|th)$/.test(node.name))flush();if('children'in node)for(const child of node.children)visit(child);if('name'in node&&/^(p|li|div|h[1-6]|tr|td|th)$/.test(node.name))flush();}
 visit(document);flush();
 function clean(node:AnyNode){if('children'in node){node.children=node.children.filter(child=>{clean(child);return !('name'in child&&/^(p|li|ul|ol|strong|b|span)$/.test(child.name)&&!textContent(child).trim()&&!getOuterHTML(child).match(/<(img|video|iframe)\b/i));});}}
 clean(document);
 const descriptionHtml=details.length?document.children.map(node=>getOuterHTML(node)).join('').replace(/(?:<br\s*\/?\s*>\s*){2,}/gi,'<br>').replace(/<br\s*\/?\s*>\s*(<\/(?:div|p)>|$)/gi,'$1'):html;
 return {descriptionHtml,details};
}
