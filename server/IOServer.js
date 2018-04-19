let Artist = require("./Artist.js");
class IOServer {
  constructor(listeningPort) {
    this.artists = [];
    this.canvas = [];
    this.server = require('socket.io')(listeningPort);
    this.server.on('connection', (socket) => this._onConnection(socket));
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    for (let i = 0; i < this.canvasHeight; i++) {
      this.canvas.push([]);
      for (let j = 0; j < this.canvasWidth; j++) {
        this.canvas[i].push("#FFFFFF");
      }
    }
  }

  _onConnection(socket) {
    console.log('client connected with id:' + socket.id);
    socket.once('nick', (nick) => this._onNickSelection(socket, nick));
  }

  _onNickSelection(socket, nick) {
    console.log('client ' + socket.id + ' registered as:' + nick);
    let newArtist = new Artist(socket, nick);
    socket.join("drawingRoom");
    socket.leave(socket.id);
    newArtist.socket.on("canvasReceived", ()=>this._onArtistInitedCanvas(newArtist));
    newArtist.socket.emit("initCanvas", this.canvas);

  }
  _onArtistInitedCanvas(newArtist){
    newArtist.socket.emit("initArtists", this._getSerializedArtistList());
    this.artists.push(newArtist);
    newArtist.socket.broadcast.to("drawingRoom").emit("artistConnected", {
      id: newArtist.id,
      nick: newArtist.nick
    });
    newArtist.socket.on("startDrawing", (drawing) => this._onStartDrawing(newArtist, drawing));
    newArtist.socket.on("stopDrawing", () => this._onStopDrawing(newArtist));
    newArtist.socket.on("draw", (drawing) => this._onDraw(newArtist,drawing));
    newArtist.socket.on("chat", (chat) => this._onChat(newArtist, chat));
    newArtist.socket.once('disconnect', () => this._onDisconnection(newArtist));
  }
  _onStartDrawing(artist, drawing) {
    artist.color = drawing.color;
    artist.lastX=drawing.x;
    artist.lastY=drawing.y;
    artist.isDrawing = true;
    this._drawPoint(artist, drawing);
    artist.socket.broadcast.to("drawingRoom").emit("artistStartDrawing", {artist:artist.serialize(),drawing:drawing});
  }
  _onStopDrawing(artist) {
    artist.isDrawing = false;
    artist.socket.broadcast.to("drawingRoom").emit("artistStopDrawing", artist.serialize());
  }
  _drawPoint(artist, drawing) {
    drawing.x = parseInt(drawing.x, 10);
    drawing.y = parseInt(drawing.y, 10);
    if (drawing.x >= 0 && drawing.x < 800 && drawing.y >= 0 && drawing.y < 600) {
      this.canvas[drawing.y][drawing.x] = drawing.color;
    }
  }
  _onDraw(artist, drawing) {
    drawing.x = parseInt(drawing.x, 10);
    drawing.y = parseInt(drawing.y, 10);
    artist.socket.broadcast.to("drawingRoom").emit("artistDraw", {artist:artist.serialize(),drawing:drawing});
    var x0=artist.lastX;
    var y0=artist.lastY;
    var x1=drawing.x;
    var y1=drawing.y;
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;

    while (true) {
      this.canvas[y0][x0] = artist.color;

      if ((x0 == x1) && (y0 == y1)) break;
      var e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
    artist.lastX=x0;
    artist.lastY=y0;
  }
  _onChat(artist, chat) {
    this.server.in("drawingRoom").emit("chat", chat);
  }

  _onDisconnection(artist) {
    console.log(artist.nick+" ["+artist.id+"] has left");
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

}
module.exports = IOServer;
