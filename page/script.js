var global = {};
var files = [{
  name: "index.tloc",
  content: 'PRINT "Start";\nLABEL abc;\n  PRINT "In Label";',
}];

function init() {
  setFile(0);
  run();
}

function run() {
  main(files[0].content);
}

function fileInput(e) {
  if (e.ctrlKey && e.key === "Enter") {
    run();
  }
}

function log(str) {
  console.log("LOG THIS:", str);
}

function setFile(num) {
  let content = files[num].content;
  $("#file").html(content);
}

function deleteFile() {

}

function createFile() {

}

function renameFile() {

}