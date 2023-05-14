/* 產生 folioaligner 格式影片 */
import {filesFromPattern,nodefs, writeChanged, readTextContent, readTextLines, splitUTF32Char,  isPunc} from 'ptk/nodebundle.cjs'
import {tmpdir} from 'os';
import {createCanvas} from 'canvas'
import {exec} from 'child_process';
/*
欽定龍藏 1024x1363
540 雜阿含
539 增一阿含
540 中阿含
541 長阿含
*/

import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
let lstfn=process.argv[2]||'ql541.lst';
if (!lstfn.endsWith('.lst')) lstfn+='.lst';
await nodefs;
const pdfdir='pdf/'
const lines=readTextLines(pdfdir+lstfn);

async function loadPdf(fn){
    const loadingTask = pdfjsLib.getDocument(fn);
    return await loadingTask.promise;
}
const renderPage=async (page,outfn)=>{
    let scale=1;
    let t=new Date();
    let viewport = page.getViewport({ scale:1});
  
    const canvas = createCanvas(viewport.width, viewport.height);
    let context = canvas.getContext('2d');

    canvas.width = Math.floor(viewport.width );
    canvas.height = Math.floor(viewport.height);
    let renderContext = {  canvasContext: context,viewport };
    await new Promise((resolve)=>{
      let renderTask = page.render(renderContext);    
      renderTask.promise.then(function(){      
        const out = fs.createWriteStream(outfn)
        const stream = canvas.createJPEGStream();
        stream.pipe(out)
        out.on('finish', () =>  {
        //   process.stdout.write('\r '+outfn+"   "+  ((new Date()-t)/1000).toFixed(2) +'   ');
          resolve();
        })
      });
    });
  }
const prefix="pdf_";
async function runCommand(command) {
    const { stdout, stderr, error } = await exec(command);
    if(stderr){
        // console.error('stderr:', stderr);
    }
    if(error){
        // console.error('error:', error);
    }
    return stdout;
}
const tmp=(tmpdir()+'/').replace(/\\/g,'/');
const tempfiles=[];
tempfiles.push('ffconcat verion 1.0');
const convertMP4=async (pdf)=>{
    for (let i=2;i<pdf.numPages;i++){
        pagecount++;
        const outfn=(tmp+prefix+pagecount.toString().padStart(4,'0')+'.jpg').replace(/\\/g,'/');
        tempfiles.push('file '+outfn)
        const page = await pdf.getPage(i)
        await renderPage(page,outfn);
    }
    
}
let pagecount=0; 
for (let i=0;i<lines.length;i++) {
    process.stdout.write('\r'+lines[i]+'     ');
    const pdf=await loadPdf( (pdfdir+lines[i]));
    await convertMP4(pdf);
}
const mp4filename=lstfn.replace(".lst",".mp4");
const cmd='ffmpeg -r 1 -i '+tmp+prefix+'%04d.jpg -vcodec libx264 -x264opts keyint=1 -qp 51 -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" '+mp4filename;
console.log('converting',mp4filename)
if (fs.existsSync(mp4filename)) fs.unlinkSync(mp4filename)

await runCommand(cmd)
const delay = ms => new Promise(r => setTimeout(r, ms))
await delay(5000);
tempfiles.shift();
tempfiles.forEach(fn=>fs.unlinkSync(fn.slice(5)) );
