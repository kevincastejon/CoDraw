"use strict";
class Artist{
  constructor(socket, nick){
    this.socket=socket;
    this.nick=nick;
    this.color;
    this.thickness=2;
    this.currentTool="pencil";
    this.alpha=1;
    this.isDrawing=false;
    this.lastX;
    this.lastY;
    this.id=socket.id;
  }
  serialize(){
    return({id:this.id, nick:this.nick});
  }
}
module.exports=Artist;
