class Main {
  constructor(serverIP) {
    this.isDrawing = false;
    this.drawColor = "#000000";
    this.ctx = stage.getContext("2d");
    this.artists = [];
    this.nick;
    this.server = io(serverIP);
    this.lastX;
    this.lastY;
    this.server.on("connect",()=>this.onConnected());
  }
  onConnected(){
    $('#waitingHeader').hide();
    $('#title').show();
    $('#loginDiv').show();
    $("#nickForm").one("submit", (e) => this.startDrawing(e));
    nickInput.focus();
  }
  startDrawing(e) {
    e.preventDefault();
    this.nick = $("#nickInput").val();
    $("#nickForm").hide();
    $("#greetings").html("Welcome " + this.nick);
    $('#loadingHeader').html("Loading pixels...");
    this.server.emit("nick", $("#nickInput").val());
    this.server.on("initCanvas", (pixels) => this.onInitCanvas(pixels));
  }
  onArtistConnected(artist) {
    var imgDiv=document.createElement("div");
    var img=new Image();
    var par=document.createElement("p");
    par.innerHTML=artist.nick;
    par.style.backgroundColor="rgba(0, 0, 0, 0.8)";
    img.src="./assets/images/penCursor.png";
    imgDiv.style.position="absolute";
    $(imgDiv).hide();
    imgDiv.style.top="0px";
    imgDiv.style.left="0px";
    imgDiv.appendChild(par);
    imgDiv.appendChild(img);
    document.body.appendChild(imgDiv);
    artist.imgDiv=imgDiv;
    this.artists.push(artist);
    this.refreshArtistList();
  }
  onArtistDisconnected(artist) {
    this.removeArtistByID(artist.id);
    this.refreshArtistList();
  }
  onInitCanvas(pixels) {
    $('#loadingHeader').html("Loading artist list...");
    this.server.on("initArtists", (artistList) => this.onInitArtists(artistList,pixels));
    this.server.emit("canvasReceived");
  }
  onInitArtists(artistList,pixels) {
    $('#loadingHeader').hide();
    this.server.on("artistConnected", (artist) => this.onArtistConnected(artist));
    this.server.on("artistDisconnected", (artist) => this.onArtistDisconnected(artist));
    this.server.on("chat", (chat) => this.onChat(chat));
    this.server.on("artistStartDrawing", (draw) => this.onArtistStartDrawing(draw));
    this.server.on("artistStopDrawing", (artist) => this.onArtistStopDrawing(artist));
    this.server.on("artistDraw", (draw) => this.onArtistDraw(draw));
    $("#stage").on("mousedown", (e) => this.canvasMouseHandler(e));
    $("#stage").on("mousemove", (e) => this.canvasMouseHandler(e));
    $(window).on("mouseup", (e) => this.canvasMouseHandler(e));
    $("#canvas").show();
    $("#chat").show();
    $("#colorPicker").on("change", () => this.drawColor = $("#colorPicker").val());
    $("#chatForm").on("submit", (e) => this.onChatSend(e));
    this.drawColor = $("#colorPicker").val();
    for (let i = 0; i < pixels.length; i++) {
      for (let j = 0; j < pixels[i].length; j++) {
        this.ctx.fillStyle = pixels[i][j];
        this.ctx.fillRect(j, i, 1, 1);
      }
    }
    let str = "";
    for (let i = 0; i < artistList.length; i++) {
      var artist=artistList[i];
      var imgDiv=document.createElement("div");
      var img=new Image();
      var par=document.createElement("p");
      par.innerHTML=artist.nick;
      par.style.backgroundColor="rgba(0, 0, 0, 0.8)";
      img.src="./assets/images/penCursor.png";
      imgDiv.style.position="absolute";
      $(imgDiv).hide();
      imgDiv.style.top="0px";
      imgDiv.style.left="0px";
      imgDiv.appendChild(par);
      imgDiv.appendChild(img);
      document.body.appendChild(imgDiv);
      artist.imgDiv=imgDiv;
      this.artists.push(artist);
      str += "<option value='" + artist.id + "'>" + artist.nick + "</option>";
    }
    $("#artistList").html(str);
    chatInput.focus();
  }

  onChat(chat) {
    $("textarea").append(chat.nick + " : " + chat.msg + "\n");
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  onChatSend(e) {
    e.preventDefault();
    this.server.emit("chat", {
      nick: this.nick,
      msg: chatInput.value
    });
    chatInput.value = "";
  }

  onArtistStartDrawing(draw) {
    var artist = this.getArtistByID(draw.artist.id);
    artist.imgDiv.style.left=(draw.drawing.x+stage.offsetLeft)+"px";
    artist.imgDiv.style.top=(draw.drawing.y+stage.offsetTop-85)+"px";
    $(artist.imgDiv).show();
    artist.color = draw.drawing.color;
    artist.lastX = draw.drawing.x;
    artist.lastY = draw.drawing.y;
    artist.isDrawing = true;

    this.ctx.fillStyle = artist.color;
    this.ctx.fillRect(draw.drawing.x, draw.drawing.y, 1, 1);
  }
  onArtistStopDrawing(artist) {
    var artist = this.getArtistByID(artist.id);
    $(artist.imgDiv).hide();
    artist.isDrawing = false;
  }
  onArtistDraw(draw) {
    var artist = this.getArtistByID(draw.artist.id);
    var x0 = artist.lastX;
    var y0 = artist.lastY;
    var x1 = draw.drawing.x;
    var y1 = draw.drawing.y;
    var dx = Math.abs(x1 - x0);
    var dy = Math.abs(y1 - y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx - dy;
    this.ctx.fillStyle = artist.color;

    while (true) {

      this.ctx.fillRect(x0, y0, 1, 1);

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
    artist.lastX = x0;
    artist.lastY = y0;
    artist.imgDiv.style.left=(x0+stage.offsetLeft)+"px";
    artist.imgDiv.style.top=(y0+stage.offsetTop-85)+"px";
  }

  canvasMouseHandler(e) {
    if (e.type == "mousedown") {
      this.isDrawing = true;
      this.lastX = parseInt(e.clientX - stage.offsetLeft + window.scrollX);
      this.lastY = parseInt(e.clientY - stage.offsetTop + window.scrollY);
      this.ctx.fillStyle = this.drawColor;
      this.ctx.fillRect(this.lastX, this.lastY, 1, 1);
      this.server.emit("startDrawing", {
        x: this.lastX,
        y: this.lastY,
        color: this.drawColor
      });
    } else if (e.type == "mouseup") {
      chatInput.focus();
      this.isDrawing = false;
      this.server.emit("stopDrawing");
    } else if (e.type == "mousemove") {
      if (this.isDrawing) {
        var x0 = this.lastX;
        var y0 = this.lastY;
        var x1 = parseInt(e.clientX - stage.offsetLeft + window.scrollX);
        var y1 = parseInt(e.clientY - stage.offsetTop + window.scrollY);
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx - dy;
        this.sendDraw(x1, y1);
        this.ctx.fillStyle = this.drawColor;

        while (true) {

          this.ctx.fillRect(x0, y0, 1, 1);

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
        this.lastX = parseInt(x0);
        this.lastY = parseInt(y0);
      }
    }
  }
  sendDraw(ptX, ptY) {
    if (this.isDrawing && ptX >= 0 && ptX < 800 && ptY >= 0 && ptY < 600)
      this.server.emit("draw", {
        x: ptX,
        y: ptY
      });
  }
  refreshArtistList() {
    let str = "";
    for (let i = 0; i < this.artists.length; i++) {
      str += "<option value='" + this.artists[i].id + "'>" + this.artists[i].nick + "</option>";
    }
    $("#artistList").html(str);
  }
  getArtistByID(artistID) {
    for (let i = 0; i < this.artists.length; i++) {
      if (this.artists[i].id === artistID) {
        return (this.artists[i]);
      }
    }
    return (null);
  }
  removeArtistByID(artistID) {
    for (let i = 0; i < this.artists.length; i++) {
      if (this.artists[i].id === artistID) {
        this.artists.splice(i, 1);
        return (null);
      }
    }
  }
}
