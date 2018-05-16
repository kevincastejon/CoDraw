let Artist = require("./Artist.js");
let Canvas = require('canvas');
let Image = Canvas.Image;

class IOServer {
  constructor(listeningPort) {
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    this.artists = [];
    this.canvas = new Canvas(this.canvasWidth, this.canvasHeight);
    this.ctx = this.canvas.getContext("2d");
    this.server = require('socket.io')(listeningPort);
    this.server.on('connection', (socket) => this._onConnection(socket));
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
  }

  _onConnection(socket) {
    console.log('client connected with id:' + socket.id);
    socket.once('nick', (nick) => this._onNickSelection(socket, nick));
  }

  _onNickSelection(socket, nick) {
    nick = nick.replace("<", '&lt;');
    nick = nick.replace(">", '&gt;');
    console.log('client ' + socket.id + ' registered as:' + nick);
    let newArtist = new Artist(socket, nick);
    socket.join("drawingRoom");
    socket.leave(socket.id);
    newArtist.socket.on("canvasReceived", () => this._onArtistInitedCanvas(newArtist));
    newArtist.socket.emit("initCanvas", {nickConfirmation:nick,pixels:Array.from(this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight).data)});
    console.log("Sending canvas to " + nick);

  }
  _onArtistInitedCanvas(newArtist) {
    newArtist.socket.emit("initArtists", this._getSerializedArtistList());
    this.artists.push(newArtist);
    newArtist.socket.broadcast.to("drawingRoom").emit("artistConnected", {
      id: newArtist.id,
      nick: newArtist.nick
    });
    newArtist.socket.on("startDrawing", (drawing) => this._onStartDrawing(newArtist, drawing));
    newArtist.socket.on("stopDrawing", (drawing) => this._onStopDrawing(newArtist, drawing));
    newArtist.socket.on("draw", (drawing) => this._onDraw(newArtist, drawing));
    newArtist.socket.on("chat", (chat) => this._onChat(newArtist, chat));
    newArtist.socket.once('disconnect', () => this._onDisconnection(newArtist));
  }
  _onStartDrawing(artist, drawing) {
    artist.color = drawing.color;
    artist.thickness = drawing.thickness;
    artist.lastX = drawing.x;
    artist.lastY = drawing.y;
    artist.isDrawing = true;
    artist.currentTool = drawing.currentTool;
    artist.alpha = drawing.alpha;
    if (artist.currentTool == "pencil") {
      this.lineTo(artist.lastX, artist.lastY,artist.lastX, artist.lastY, artist.color, artist.thickness,artist.alpha);
    }
    artist.socket.broadcast.to("drawingRoom").emit("artistStartDrawing", {
      artist: artist.serialize(),
      drawing: drawing
    });
  }
  _onStopDrawing(artist, drawing) {
    artist.isDrawing = false;
    artist.socket.broadcast.to("drawingRoom").emit("artistStopDrawing", {
      artist: artist.serialize(),
      drawing: drawing
    });
    if (artist.currentTool == "line") {
      this.lineTo(artist.lastX, artist.lastY, drawing.x, drawing.y, artist.color, artist.thickness,artist.alpha);
    } else if (artist.currentTool == "squareStroke") {
      this.drawStrokeRect(artist.lastX, artist.lastY, drawing.x, drawing.y, artist.color, artist.thickness,artist.alpha);
    } else if (artist.currentTool == "squareFull") {
      this.drawFullRect(artist.lastX, artist.lastY, drawing.x, drawing.y, artist.color, artist.thickness,artist.alpha);
    } else if (artist.currentTool == "circleStroke") {
      this.drawStrokeCircle(artist.lastX, artist.lastY, drawing.x, drawing.y, artist.color, artist.thickness,artist.alpha);
    } else if (artist.currentTool == "circleFull") {
      this.drawFullCircle(artist.lastX, artist.lastY, drawing.x, drawing.y, artist.color, artist.thickness,artist.alpha);
    }
  }
  _onDraw(artist, drawing) {
    // drawing.x = parseInt(drawing.x, 10);
    // drawing.y = parseInt(drawing.y, 10);
    //if (drawing.x >= 0 && drawing.x < this.canvasWidth && drawing.y >= 0 && drawing.y < this.canvasHeight) {
      artist.socket.broadcast.to("drawingRoom").emit("artistDraw", {
        artist: artist.serialize(),
        drawing: drawing
      });
      if (artist.currentTool == "pencil") {
        this.lineTo(artist.lastX, artist.lastY, drawing.x, drawing.y, artist.color, artist.thickness,artist.alpha);
        artist.lastX = drawing.x;
        artist.lastY = drawing.y;
      }
    //}
  }
  drawStrokeCircle(fromX, fromY, toX, toY, color, thickness,alpha) {
    this._drawEllipse(fromX, fromY, toX, toY, color, thickness,alpha, false);
  }
  drawFullCircle(fromX, fromY, toX, toY, color, thickness,alpha) {
    this._drawEllipse(fromX, fromY, toX, toY, color, thickness,alpha, true);
  }
  _drawEllipse(fromX, fromY, toX, toY, color, thickness,alpha,  fill = false) {
    this.ctx.lineWidth = thickness;
    this.ctx.strokeStyle = this.hexToRGBA(color,alpha);
    this.ctx.fillStyle = this.hexToRGBA(color,alpha);
    this.ctx.beginPath();
    var x1 = fromX,
      y1 = fromY;
    var x2 = toX,
      y2 = toY;
    var radiusX = (x2 - x1) * 0.5,
      radiusY = (y2 - y1) * 0.5;
    var centerX = x1 + radiusX,
      centerY = y1 + radiusY,
      step = 0.01,
      a = step,
      pi2 = Math.PI * 2 - step;

    this.ctx.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));
    for (; a < pi2; a += step) {
      this.ctx.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY * Math.sin(a));
    }
    this.ctx.closePath();
    if (fill)
      this.ctx.fill();
    else
      this.ctx.stroke();
  }
  drawStrokeRect(fromX, fromY, toX, toY, color, thickness,alpha, temp = false) {
    if(Math.abs(toX-fromX)>thickness && Math.abs(toY-fromY)>thickness)
    this._drawRect(fromX, fromY, toX, toY, color,thickness,alpha, false,temp);
  }
  drawFullRect(fromX, fromY, toX, toY, color,thickness,alpha, temp = false) {
    this._drawRect(fromX, fromY, toX, toY, color,thickness,alpha, true,temp);
  }
  _drawRect(fromX, fromY, toX, toY, color, thickness,alpha,fill=false,temp = false){
    this.ctx.lineWidth = thickness;
    this.ctx.strokeStyle = this.hexToRGBA(color,alpha);
    this.ctx.fillStyle = this.hexToRGBA(color,alpha);
    this.ctx.beginPath();
    this.ctx.rect(fromX, fromY, toX-fromX, toY-fromY);
    this.ctx.closePath();
    if (fill)
      this.ctx.fill();
    else
      this.ctx.stroke();
  }
  lineTo(fromX, fromY, toX, toY, color, thickness,alpha) {
    this.ctx.lineWidth = thickness;
    this.ctx.strokeStyle = this.hexToRGBA(color,alpha);
    this.ctx.lineCap = "round";
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();
  }
  _onChat(artist, chat) {
    chat = chat.replace("<", '&lt;');
    chat = chat.replace(">", '&gt;');
    this.server.in("drawingRoom").emit("chat", {nick:artist.nick,msg:chat});
  }

  _onDisconnection(artist) {
    console.log(artist.nick + " [" + artist.id + "] has left");
    this._removeArtistByID(artist.id);
    this.server.in("drawingRoom").emit("artistDisconnected", artist.serialize());
  }

  _getArtistByID(artistID) {
    for (let i = 0; i < this.artists.length; i++) {
      if (this.artists[i].id === artistID) {
        return (this.artists[i]);
      }
    }
    return (null);
  }
  _removeArtistByID(artistID) {
    for (let i = 0; i < this.artists.length; i++) {
      if (this.artists[i].id === artistID) {
        this.artists.splice(i, 1);
        return (null);
      }
    }
  }
  _getSerializedArtistList() {
    let ret = [];
    for (let i = 0; i < this.artists.length; i++) {
      ret.push(this.artists[i].serialize());
    }
    return ret;
  }
  hexToRGBA(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

    if (alpha) {
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    } else {
      return "rgb(" + r + ", " + g + ", " + b + ")";
    }
  }

}
module.exports = IOServer;
