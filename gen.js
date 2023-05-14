/* 產生 永樂北藏換行 */
/* 轉換經號 */

import {meta_cbeta,filesFromPattern,nodefs, writeChanged, readTextContent, readTextLines, splitUTF32Char,  isPunc} from 'ptk/nodebundle.cjs'

await nodefs;

const srcfn='da.xml';//taisho-longcang.xml' ; //取自 道中法師 龍藏頁碼

const splitPage=page=>{
    if (!page) return [];
    const out=[];
    let i=0,line='',chicount=0;
    const chars=splitUTF32Char(page);
    while (i<chars.length) {
        if (chars[i]!=='§') line+=chars[i];
        if (chars[i]=='[') {
            while (chars[i]!==']' && i<chars.length) i++;//skip missing character
        }
        if (!isPunc(chars[i]) && chars[i].charCodeAt(0)>=0x3400 ) {
            chicount++;
        }

        const forcebreak=(chars[i]=='§');
        if (forcebreak || chicount>=17) {
            out.push(line);
            chicount=0;
            line='';
        }
        i++;
    }
    if (line) out.push(line);

    return out.join('\n').replace(/\n。/g,'。\n').replace(/\n．/g,'．\n').split('\n')
}
/*
取得大正經號，轉為北藏號
*/
const doLines=lines=>{
    let page='', prevno,prevjuan;
    let juantext=[],out=[];
    for (let i=0;i<lines.length;i++) {
        let line=lines[i];
        if (line.charAt(0)!=='T') continue;
        
        if (~line.indexOf('【L')||~line.indexOf('【CL')) { // 龍藏卷首標記
            const vnp=meta_cbeta.nextColumn(meta_cbeta.parseVolNoPage(line));
            const [no,juan]=meta_cbeta.TaishoJuanFromPage( vnp.vol,vnp.page,vnp.col);

            line=line.replace(/【C?L[\da-z_]+】/,'\n');
            if (prevjuan!==juan || no!==prevno) {
                if (prevno!==no) {
                    out.push('^no '+no);
                }
                if (prevno && prevjuan) {
                    out.push('^juan'+prevjuan);
                    out.push(juantext.join('\n'));
                    juantext=[];    
                }
            }


            prevno=no;
            prevjuan=juan;
        }
        
        let text=line.slice(18);
        if (text.startsWith('　　')) text+='§'; //forcelinebreak
        if (~text.indexOf('【□】')) text+='§';
        const at=text.indexOf('【●】');
        if (~at) {
            page+=text.slice(0,at)+'\n^pb';
            juantext.push( ... splitPage(page));
            page=text.slice(text.lastIndexOf('【●】')+3);
        } else {
            page+=text;
        }        
    }

    //final
    juantext.push(...splitPage(page));

    out.push('^no '+prevno);
    out.push('^juan'+prevjuan);
    out.push(juantext.join('\n'));

    return out;
}

const lines=readTextLines(srcfn);

const out=doLines(lines);

writeChanged('out.txt',out.join("\n"),true)