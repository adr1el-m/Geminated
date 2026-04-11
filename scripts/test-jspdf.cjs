const { jsPDF } = require("jspdf");
const doc = new jsPDF();
doc.text("Hello", 10, 10);
console.log(doc.output('arraybuffer').byteLength);
