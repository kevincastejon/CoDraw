class Main {
  constructor(serverIP) {
    this.selfArtist = {
      isDrawing: false,
      color: "#0000FF",
      thickness: 1,
      nick: "",
      lastX: 0,
      lastY: 0,
      currentTool: "pencil",
      alpha: 1,
      tempDraw: null
    };
    var nicks=["Renoir", "Picasso", "Gauguin", "Monet", "Van Gogh", "Cézanne", "Manet", "Degas", "Rembrandt", "Courbet", "De Vinci", "Chagall", "Klimt", "Braque", "Raphaël", "Dali", "Kandinsky", "Signac"];
    nickInput.value=nicks[parseInt(Math.random()*nicks.length)];
    this.createPenIcon(this.selfArtist);
    this.ctx = stage.getContext("2d");
    this.artists = [];
    this.server = io(serverIP);
    this.server.on("connect", () => this.onConnected());
    this.drawTimer;
    this.privateCanvas = document.createElement("canvas");
    this.privateCanvas.width = 800;
    this.privateCanvas.height = 600;
    this.offScreenCtx = this.privateCanvas.getContext("2d");
    this.offScreenCtx.webkitImageSmoothingEnabled = false;
    this.offScreenCtx.msImageSmoothingEnabled = false;
    this.offScreenCtx.imageSmoothingEnabled = false;
  }
  canvasDraw() {
    this.ctx.drawImage(this.privateCanvas, 0, 0);
    if (this.selfArtist.tempDraw) {
      if (this.selfArtist.currentTool == "line")
        this.lineTo(this.selfArtist.lastX, this.selfArtist.lastY, this.selfArtist.tempDraw.x, this.selfArtist.tempDraw.y, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha, true);
      else if (this.selfArtist.currentTool == "squareStroke")
        this.drawStrokeRect(this.selfArtist.lastX, this.selfArtist.lastY, this.selfArtist.tempDraw.x, this.selfArtist.tempDraw.y, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha, true);
      else if (this.selfArtist.currentTool == "squareFull")
        this.drawFullRect(this.selfArtist.lastX, this.selfArtist.lastY, this.selfArtist.tempDraw.x, this.selfArtist.tempDraw.y, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha, true);
      else if (this.selfArtist.currentTool == "circleStroke")
        this.drawStrokeEllipse(this.selfArtist.lastX, this.selfArtist.lastY, this.selfArtist.tempDraw.x, this.selfArtist.tempDraw.y, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha, true);
      else if (this.selfArtist.currentTool == "circleFull")
        this.drawFullEllipse(this.selfArtist.lastX, this.selfArtist.lastY, this.selfArtist.tempDraw.x, this.selfArtist.tempDraw.y, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha, true);
    }
    for (var i = 0; i < this.artists.length; i++) {
      if (this.artists[i].tempDraw) {
        if (this.artists[i].currentTool == "line")
          this.lineTo(this.artists[i].lastX, this.artists[i].lastY, this.artists[i].tempDraw.x, this.artists[i].tempDraw.y, this.artists[i].color, this.artists[i].thickness, this.artists[i].alpha, true);
        else if (this.artists[i].currentTool == "squareStroke")
          this.drawStrokeRect(this.artists[i].lastX, this.artists[i].lastY, this.artists[i].tempDraw.x, this.artists[i].tempDraw.y, this.artists[i].color, this.artists[i].thickness, this.artists[i].alpha, true);
        else if (this.artists[i].currentTool == "squareFull")
          this.drawFullRect(this.artists[i].lastX, this.artists[i].lastY, this.artists[i].tempDraw.x, this.artists[i].tempDraw.y, this.artists[i].color, this.artists[i].thickness, this.artists[i].alpha, true);
        else if (this.artists[i].currentTool == "circleStroke")
          this.drawStrokeEllipse(this.artists[i].lastX, this.artists[i].lastY, this.artists[i].tempDraw.x, this.artists[i].tempDraw.y, this.artists[i].color, this.artists[i].thickness, this.artists[i].alpha, true);
        else if (this.artists[i].currentTool == "circleFull")
          this.drawFullEllipse(this.artists[i].lastX, this.artists[i].lastY, this.artists[i].tempDraw.x, this.artists[i].tempDraw.y, this.artists[i].color, this.artists[i].thickness, this.artists[i].alpha, true);
      }
    }
  }
  onConnected() {
    $('#waitingHeader').hide();
    $('#title').show();
    $('#loginDiv').show();
    $("#nickForm").one("submit", (e) => this.submitNick(e));
    nickInput.focus();
  }
  submitNick(e) {
    e.preventDefault();
    this.selfArtist.nick = $("#nickInput").val();
    $("#nickForm").hide();
    $('#loadingHeader').html("Loading pixels...");
    this.server.emit("nick", $("#nickInput").val());
    this.server.on("initCanvas", (obj) => {
      this.selfArtist.nick = obj.nickConfirmation;
      $("#greetings").html("Welcome " + this.selfArtist.nick);
      this.onInitCanvas(obj.pixels);
    });
  }
  onArtistConnected(artist) {
    this.createPenIcon(artist);
    this.artists.push(artist);
    this.refreshArtistList();
  }
  createPenIcon(artist){
    var imgDiv = document.createElement("div");
    var img = new Image();
    var par = document.createElement("p");
    par.innerHTML = artist.nick;
    par.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    img.src = "./assets/images/penCursor.png";
    imgDiv.style.position = "absolute";
    $(imgDiv).hide();
    imgDiv.style.top = "0px";
    imgDiv.style.left = "0px";
    imgDiv.appendChild(par);
    imgDiv.appendChild(img);
    document.body.appendChild(imgDiv);
    $(imgDiv).css({
      userSelect: 'none',
      userDrag: 'none',
      pointerEvents: 'none',
      margin:0,
      padding:0
    });
    $(imgDiv).children().css({
      userSelect: 'none',
      userDrag: 'none',
      pointerEvents: 'none',
      margin:0,
      padding:0
    });
    artist.imgDiv = imgDiv;
  }
  onArtistDisconnected(artist) {
    this.removeArtistByID(artist.id);
    this.refreshArtistList();
  }
  onInitCanvas(pixels) {
    $('#loadingHeader').html("Loading artist list...");
    this.server.on("initArtists", (artistList) => this.onInitArtists(artistList, pixels));
    this.server.emit("canvasReceived");
  }
  onInitArtists(artistList, pixels) {
    $('#loadingHeader').hide();
    this.server.on("artistConnected", (artist) => this.onArtistConnected(artist));
    this.server.on("artistDisconnected", (artist) => this.onArtistDisconnected(artist));
    this.server.on("chat", (chat) => this.onChat(chat));
    this.server.on("artistStartDrawing", (draw) => this.onArtistStartDrawing(draw));
    this.server.on("artistStopDrawing", (draw) => this.onArtistStopDrawing(draw));
    this.server.on("artistDraw", (draw) => this.onArtistDraw(draw));
    $("#stage").on("mousedown", (e) => this.canvasMouseHandler(e));
    $("#stage").on("mouseover", (e) => {
    var rX = parseInt(e.clientX+ window.scrollX);
    var rY = parseInt(e.clientY+ window.scrollY)-31;
      this.selfArtist.imgDiv.style.left = rX + "px";
      this.selfArtist.imgDiv.style.top = rY + "px";
      $(this.selfArtist.imgDiv).show();
    });
    $("#stage").on("mousemove", (e) => {
      var rX = parseInt(e.clientX+ window.scrollX);
      var rY = parseInt(e.clientY+ window.scrollY)-31;
      this.selfArtist.imgDiv.style.left = rX + "px";
      this.selfArtist.imgDiv.style.top = rY + "px";
    });
    $("#stage").on("mouseout", (e) => {$(this.selfArtist.imgDiv).hide();});
    $(window).on("mousemove", (e) => this.canvasMouseHandler(e));
    $(window).on("mouseup", (e) => this.canvasMouseHandler(e));
    $("#canvas").show();
    $("#chat").show();
    $("#colorPicker").on("change", () => this.selfArtist.color = $("#colorPicker").val());

    $("#thicknessSelector").on("change", () => {
      this.selfArtist.thickness = $("#thicknessSelector").val()
    });
    $("#chatForm").on("submit", (e) => this.onChatSend(e));
    $('#toolSelector').on("change", () => {
      this.selfArtist.currentTool = $('#toolSelector').val();
    });
    $('#alphaSelector').on("change", () => {
      this.selfArtist.alpha = $('#alphaSelector').val();
    });
    this.selfArtist.alpha = $('#alphaSelector').val();
    this.selfArtist.currentTool = $('#toolSelector').val();
    this.selfArtist.color = $("#colorPicker").val();
    this.selfArtist.thickness = $("#thicknessSelector").val();
    let newImgDt = this.offScreenCtx.createImageData(800, 600);
    newImgDt.data.set(pixels);
    this.offScreenCtx.putImageData(newImgDt, 0, 0);
    this.drawTimer = setInterval(() => {
      this.canvasDraw();
    }, 30);
    let str = "";
    for (let i = 0; i < artistList.length; i++) {
      var artist = artistList[i];
      this.createPenIcon(artist);
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
    this.server.emit("chat", chatInput.value);
    chatInput.value = "";
  }

  onArtistStartDrawing(draw) {
    var artist = this.getArtistByID(draw.artist.id);
    artist.imgDiv.style.left = (draw.drawing.x + stage.offsetLeft) + "px";
    artist.imgDiv.style.top = (draw.drawing.y + stage.offsetTop - 54) + "px";
    $(artist.imgDiv).show();
    artist.color = draw.drawing.color;
    artist.lastX = draw.drawing.x;
    artist.lastY = draw.drawing.y;
    artist.isDrawing = true;
    artist.thickness = draw.drawing.thickness;
    artist.currentTool = draw.drawing.currentTool;
    artist.alpha = draw.drawing.alpha;
    if (artist.currentTool == "pencil") {
      this.lineTo(artist.lastX, artist.lastY, artist.lastX, artist.lastY, artist.color, artist.thickness, artist.alpha);
    }
  }
  onArtistStopDrawing(draw) {
    var artist = this.getArtistByID(draw.artist.id);
    $(artist.imgDiv).hide();
    artist.isDrawing = false;
    if (artist.currentTool == "line") {
      this.lineTo(artist.lastX, artist.lastY, draw.drawing.x, draw.drawing.y, artist.color, artist.thickness, artist.alpha);
      artist.tempDraw = null;
    } else if (artist.currentTool == "squareStroke") {
      this.drawStrokeRect(artist.lastX, artist.lastY, draw.drawing.x, draw.drawing.y, artist.color, artist.thickness, artist.alpha);
      artist.tempDraw = null;
    } else if (artist.currentTool == "squareFull") {
      this.drawFullRect(artist.lastX, artist.lastY, draw.drawing.x, draw.drawing.y, artist.color, artist.thickness, artist.alpha);
      artist.tempDraw = null;
    } else if (artist.currentTool == "circleStroke") {
      this.drawStrokeEllipse(artist.lastX, artist.lastY, draw.drawing.x, draw.drawing.y, artist.color, artist.thickness, artist.alpha);
      artist.tempDraw = null;
    } else if (artist.currentTool == "circleFull") {
      this.drawFullEllipse(artist.lastX, artist.lastY, draw.drawing.x, draw.drawing.y, artist.color, artist.thickness, artist.alpha);
      artist.tempDraw = null;
    }
  }
  onArtistDraw(draw) {
    var artist = this.getArtistByID(draw.artist.id);
    if (artist.currentTool == "pencil") {
      this.lineTo(artist.lastX, artist.lastY, draw.drawing.x, draw.drawing.y, artist.color, artist.thickness, artist.alpha);
      artist.lastX = draw.drawing.x;
      artist.lastY = draw.drawing.y;
    } else if (artist.currentTool == "line" || artist.currentTool == "squareStroke" || artist.currentTool == "squareFull" || artist.currentTool == "circleStroke" || artist.currentTool == "circleFull") {
      artist.tempDraw = {
        x: draw.drawing.x,
        y: draw.drawing.y
      };
    }
    artist.imgDiv.style.left = (draw.drawing.x + stage.offsetLeft) + "px";
    artist.imgDiv.style.top = (draw.drawing.y + stage.offsetTop - 54) + "px";
  }

  canvasMouseHandler(e) {
    var rX = parseInt(e.clientX - stage.offsetLeft + window.scrollX);
    var rY = parseInt(e.clientY - stage.offsetTop + window.scrollY);
    if (e.type == "mousedown") {
      this.selfArtist.isDrawing = true;
      this.selfArtist.lastX = rX;
      this.selfArtist.lastY = rY;
      if (this.selfArtist.currentTool == "pencil") {
        this.lineTo(rX, rY, rX, rY, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha);
      }
      this.server.emit("startDrawing", {
        x: this.selfArtist.lastX,
        y: this.selfArtist.lastY,
        color: this.selfArtist.color,
        thickness: this.selfArtist.thickness,
        currentTool: this.selfArtist.currentTool,
        alpha: this.selfArtist.alpha
      });

    } else if (e.type == "mouseup") {
      chatInput.focus();
      if (this.selfArtist.isDrawing) {
        this.selfArtist.isDrawing = false;
        if (this.selfArtist.currentTool == "line") {
          this.lineTo(this.selfArtist.lastX, this.selfArtist.lastY, rX, rY, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha);
          this.selfArtist.tempDraw = null;
        } else if (this.selfArtist.currentTool == "squareStroke") {
          this.drawStrokeRect(this.selfArtist.lastX, this.selfArtist.lastY, rX, rY, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha);
          this.selfArtist.tempDraw = null;
        } else if (this.selfArtist.currentTool == "squareFull") {
          this.drawFullRect(this.selfArtist.lastX, this.selfArtist.lastY, rX, rY, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha);
          this.selfArtist.tempDraw = null;
        } else if (this.selfArtist.currentTool == "circleStroke") {
          this.drawStrokeEllipse(this.selfArtist.lastX, this.selfArtist.lastY, rX, rY, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha);
          this.selfArtist.tempDraw = null;
        } else if (this.selfArtist.currentTool == "circleFull") {
          this.drawFullEllipse(this.selfArtist.lastX, this.selfArtist.lastY, rX, rY, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha);
          this.selfArtist.tempDraw = null;
        }
        this.server.emit("stopDrawing", {
          x: rX,
          y: rY
        });
      }
    } else if (e.type == "mousemove") {
      if (this.selfArtist.isDrawing) {
        if (this.selfArtist.currentTool == "pencil") {
          this.lineTo(this.selfArtist.lastX, this.selfArtist.lastY, rX, rY, this.selfArtist.color, this.selfArtist.thickness, this.selfArtist.alpha);
          this.selfArtist.lastX = rX;
          this.selfArtist.lastY = rY;
        } else if (this.selfArtist.currentTool == "line" || this.selfArtist.currentTool == "squareStroke" || this.selfArtist.currentTool == "squareFull" || this.selfArtist.currentTool == "circleStroke" || this.selfArtist.currentTool == "circleFull") {
          this.selfArtist.tempDraw = {
            x: rX,
            y: rY
          };
        }
        this.sendDraw(rX, rY);

      }
    }
  }
  drawStrokeEllipse(fromX, fromY, toX, toY, color, thickness, alpha, temp = false) {
    if(fromX!=toX && fromY!=toY)
    this._drawEllipse(fromX, fromY, toX, toY, color, thickness, alpha, false, temp);
  }
  drawFullEllipse(fromX, fromY, toX, toY, color, thickness, alpha, temp = false) {
    this._drawEllipse(fromX, fromY, toX, toY, color, thickness, alpha, true, temp);
  }
  _drawEllipse(fromX, fromY, toX, toY, color, thickness, alpha, fill = false, temp = false) {
    var ctx = this.offScreenCtx;
    if (temp) ctx = this.ctx;
    ctx.lineWidth = thickness;
    ctx.strokeStyle = this.hexToRGBA(color, alpha);
    ctx.fillStyle = this.hexToRGBA(color, alpha);
    ctx.beginPath();
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

    ctx.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));
    for (; a < pi2; a += step) {
      ctx.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY * Math.sin(a));
    }
    ctx.closePath();
    if (fill)
      ctx.fill();
    else
      ctx.stroke();
  }
  drawStrokeRect(fromX, fromY, toX, toY, color, thickness, alpha, temp = false) {
    if(Math.abs(toX-fromX)>thickness && Math.abs(toY-fromY)>thickness)
    this._drawRect(fromX, fromY, toX, toY, color, thickness, alpha, false, temp);
  }
  drawFullRect(fromX, fromY, toX, toY, color, thickness, alpha, temp = false) {
    this._drawRect(fromX, fromY, toX, toY, color, thickness, alpha, true, temp);
  }
  _drawRect(fromX, fromY, toX, toY, color, thickness, alpha, fill = false, temp = false) {
    var ctx = this.offScreenCtx;
    if (temp) ctx = this.ctx;
    ctx.lineWidth = thickness;
    ctx.strokeStyle = this.hexToRGBA(color, alpha);
    ctx.fillStyle = this.hexToRGBA(color, alpha);
    ctx.beginPath();
    ctx.rect(fromX, fromY, toX - fromX, toY - fromY);
    ctx.closePath();
    if (fill)
      ctx.fill();
    else
      ctx.stroke();
  }
  lineTo(fromX, fromY, toX, toY, color, thickness, alpha, temp = false) {
    var ctx = this.offScreenCtx;
    if (temp) ctx = this.ctx;
    ctx.lineWidth = thickness;
    ctx.strokeStyle = this.hexToRGBA(color, alpha);
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
  }
  sendDraw(ptX, ptY) {
    //if (ptX >= 0 && ptX < 800 && ptY >= 0 && ptY < 600)
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
        $(this.artists[i].imgDiv).remove();
        this.artists.splice(i, 1);
        return (null);
      }
    }
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
