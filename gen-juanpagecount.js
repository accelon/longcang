let pagecount=0, juanpagecount=[]; 
for (let i=0;i<lines.length;i++) {
    process.stdout.write('\r'+lines[i]+'     ');
    const pdf=await loadPdf( (pdfdir+lines[i]));
    juanpagecount.push(pdf.numPages-1);
}