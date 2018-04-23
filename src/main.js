import EXIF from 'exif-js';
var poster = {
    resultImgUrl: "",
    isUploaded: false,
    el: {
        upload: document.getElementById('upload'),
        btnConfirm: document.getElementById('btnConfirm'),
        content: document.getElementById('content'),
        btnText: document.getElementById('btnText'),
        spinner: document.getElementById('spinner'),
        errorPrompt: document.getElementById('error-prompt'),
        slogan1: document.getElementById('slogan1'),
        slogan2: document.getElementById('slogan2'),
        compose: document.getElementById('compose'),
        resultBox: document.getElementById('resultBox')
    },
    init: function () {
        this.bindEvent();
    },
    bindEvent: function () {
        var that = this;
        that.el.btnConfirm.addEventListener("click", function () {
            that.doGenerate();
        });
        that.el.upload.addEventListener("change", function () {
            that.uploadImg();
        })
    },
    checkform: function () {
        var that = this;
        if (that.el.upload.value.length == 0) {
            that.el.errorPrompt.innerHTML = "请上传图片";
            return false;
        }
        return true;
    },
    //canvas竖排文字，value(文本)，ctx(canvas上下文)，x(x坐标），y(y坐标),drop(文字行高)
    verticalWord: function (value, ctx, x, y, drop) {
        var newvalue = value.split("");
        for (var i = 0; i < newvalue.length; i++) {
            ctx.fillText(newvalue[i], x, y);
            y += drop;
        }
    },
    //canvas黑白滤镜
    imageFilter: function (ctx, x, y) {
        var imgdata = ctx.getImageData(0, 0, x, y);
        var data = imgdata.data;
        for (var i = 0, n = data.length; i < n; i += 4) {
            var average = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = average;
            data[i + 1] = average;
            data[i + 2] = average;
        }
        ctx.putImageData(imgdata, 0, 0);
        ctx.save();
    },
    uploadImg: function () {
        var that = this;
        var file = that.el.upload.files[0];
        if (!file) {
            that.el.btnText.innerHTML = "上传照片";
            return;
        }
        that.el.spinner.style.display = "none";
        that.el.btnText.innerHTML = "上传中...";
        var orientation = "";
        //EXIF js 可以读取图片的元信息 https://github.com/exif-js/exif-js
        EXIF.getData(file, function () {
            orientation = EXIF.getTag(this, 'Orientation');
        });
        var reader = new FileReader();
        // 将文件以Data URL形式进行读入页面
        reader.readAsDataURL(file);
        reader.onload = function () {
            that.sourceImg = new Image();
            //处理iOS照片旋转
            if (orientation && orientation != "1") {
                that.rotateImage(this.result, orientation, function (data) {
                    that.sourceImg.src = data;
                });
            } else {
                that.sourceImg.src = this.result;
            }
            that.sourceImg.onload = function () {
                that.el.btnText.innerHTML = "上传成功";
                that.isUploaded = true;
            }
        };
    },
    //处理ios照片翻转
    rotateImage: function (img, dir, next) {
        var image = new Image();
        image.onload = function () {
            var degree = 0,
                drawWidth, drawHeight, width, height;
            drawWidth = this.naturalWidth;
            drawHeight = this.naturalHeight;
            var canvas = document.createElement('canvas');
            canvas.width = width = drawWidth;
            canvas.height = height = drawHeight;
            var context = canvas.getContext('2d');
            //判断图片方向，重置canvas大小，确定旋转角度，iphone默认的是home键在右方的横屏拍摄方式
            switch (dir) {
                //iphone横屏拍摄，此时home键在左侧
                case 3:
                    degree = 180;
                    drawWidth = -width;
                    drawHeight = -height;
                    break;
                    //iphone竖屏拍摄，此时home键在下方(正常拿手机的方向)
                case 6:
                    canvas.width = height;
                    canvas.height = width;
                    degree = 90;
                    drawWidth = width;
                    drawHeight = -height;
                    break;
                    //iphone竖屏拍摄，此时home键在上方
                case 8:
                    canvas.width = height;
                    canvas.height = width;
                    degree = 270;
                    drawWidth = -width;
                    drawHeight = height;
                    break;
            }
            //使用canvas旋转校正
            context.rotate(degree * Math.PI / 180);
            context.drawImage(this, 0, 0, drawWidth, drawHeight);
            //返回校正图片
            next(canvas.toDataURL("image/jpeg", .8));
        }
        image.src = img;
    },
    doGenerate: function () {
        var that = this;
        if (!that.checkform()) {
            return;
        } else if (!that.isUploaded) {
            that.el.errorPrompt.innerHTML = "正在预处理，请稍后再次点击生成";
            return;
        }
        that.el.errorPrompt.innerHTML = "正在生成";
        that.el.spinner.style.display = "block";
        that.generatePoster();
    },
    generatePoster: function () {
        var that = this;
        var canvas = document.createElement('canvas');
        var ClientWidth = document.documentElement.clientWidth;
        var ctx = canvas.getContext('2d');
        canvas.width = 640;
        canvas.height = 1136;
        //处理等比拉伸压缩用户图片并居中裁剪
        var imgRatio = canvas.width / canvas.height; //目标图片的宽高比
        var userimgRatio = that.sourceImg.width / that.sourceImg.height; //原始图片的宽高比
        var r = (userimgRatio > imgRatio) ? (canvas.height / that.sourceImg.height) : (canvas.width / that.sourceImg.width);
        var drawObj = {
            sx: userimgRatio > imgRatio ? (that.sourceImg.width - canvas.width/r) / 2 : 0,
            sy: userimgRatio > imgRatio ? 0 : (that.sourceImg.height - canvas.height/r) / 2,
            sWidth: canvas.width/r,
            sHeight: canvas.height/r,
            dx: 0,
            dy: 0,
            dWidth: canvas.width,
            dHeight: canvas.height
        };
        //图片居中裁剪
        ctx.drawImage(that.sourceImg, drawObj.sx, drawObj.sy, drawObj.sWidth, drawObj.sHeight, drawObj.dx, drawObj.dy, drawObj.dWidth, drawObj.dHeight);
        var newimg = new Image();
        newimg.src = "/src/images/poster-bg.png";
        newimg.onload = function () {
            ctx.drawImage(newimg, 0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
            ctx.font = 36 + "px sans-serif";
            ctx.fillText(that.el.slogan1.value, 50, 1000);
            ctx.fillText(that.el.slogan2.value, 50, 1070);
            that.resultImgUrl = canvas.toDataURL("image/jpeg", .5);
            that.posterImg();
        };
    },
    posterImg: function () {
        var that = this;
        that.el.compose.src = that.resultImgUrl;
        that.el.content.style.display = "none";
        that.el.errorPrompt.innerHTML = "";
        that.el.resultBox.style.display = "block";
    }
}
poster.init();