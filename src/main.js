import EXIF from 'exif-js';
window.onload = function () {
    //changeFontSizeNewMicoSite();
    function ele(id) {
        return document.getElementById(id);
    }
    var upload = ele('upload');
    var btnConfirm = ele('btnConfirm');
    upload.addEventListener('change', function () {
        var upload = ele('upload');
        var file = upload.files[0];
        if (!file) {
            ele('btnText').innerHTML = "上传照片";
            return;
        }
        ele('spinner').style.display = "none";
        ele('btnText').innerHTML = "上传中...";
        var file = this.files[0];
        var orientation;
        var make;
        //EXIF js 可以读取图片的元信息 https://github.com/exif-js/exif-js
        EXIF.getData(file, function () {
            make = EXIF.getTag(this, 'Make');
            //alert(make);
            orientation = EXIF.getTag(this, 'Orientation');
        });
        var reader = new FileReader();
        reader.readAsDataURL(file); // 将文件以Data URL形式进行读入页面
        reader.onload = function () {
            var img = new Image();
            //处理iOS照片旋转
            if (orientation && orientation != "1") {
                getImgData(this.result, orientation, function (data) {
                    img.src = data;
                });
            } else {
                img.src = this.result;
            }
            img.onload = function () {
                generatePoster(img, function (data) {
                    ele('btnText').innerHTML = "上传成功";
                    btnConfirm.onclick = function () {
                        if (checkform()) {
                            ele('error-prompt').innerHTML = "正在生成海报";
                            ele('spinner').style.display = "block";
                            ele('btnConfirm').disabled = true;
                            setTimeout(function () {
                                getImage(data);
                            }, 10);
                        }
                    };
                });
            }
        };
    });
    btnConfirm.onclick = function () {
        checkform();
    };
    //表单校验
    function checkform() {
        var inputList = document.getElementsByClassName('form-control');
        for (var i = 0; i < inputList.length; i++) {
            inputList[i].style.border = "1px solid #bebebe";
        }
        var errorPrompt = ele('error-prompt');
        if (ele('slogan1').value.length == 0 && ele('slogan2').value.length == 0) {
            errorPrompt.innerHTML = "请输入教育初心";
            ele('slogan1').style.border = '1px solid #f08200';
            ele('slogan2').style.border = '1px solid #f08200';
            return false;
        } else if (ele('slogan1').value.length == 0 && ele('slogan2').value.length > 0) {
            errorPrompt.innerHTML = "请输入完整的教育初心";
            ele('slogan1').style.border = '1px solid #f08200';
            return false;
        } else if (ele('slogan1').value.length > 0 && ele('slogan2').value.length == 0) {
            errorPrompt.innerHTML = "请输入完整的教育初心";
            ele('slogan2').style.border = '1px solid #f08200';
            return false;
        } else if (ele('upload').value.length == 0) {
            errorPrompt.innerHTML = "请上传图片";
            return false;
        }
        return true;
    }
    //处理ios照片翻转
    function getImgData(img, dir, next) {
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
    }
    //图片等比缩放
    function resizeImage(w, h, objimg) {
        var image = new Image();
        var canvas1 = document.createElement('canvas');
        canvas1.width = w;
        canvas1.height = h;
        var ctx2 = canvas1.getContext('2d');
        ctx2.drawImage(objimg, 0, 0, canvas1.width, canvas1.height);
        image.src = canvas1.toDataURL("image/jpg");
        return image;
    }
    //canvas竖排文字，value(文本)，ctx(canvas上下文)，x(x坐标），y(y坐标),drop(文字行高)
    function verticalWord(value, ctx, x, y, drop) {
        var newvalue = value.split("");
        for (var i = 0; i < newvalue.length; i++) {
            ctx.fillText(newvalue[i], x, y);
            y += drop;
        }
    }
    //canvas黑白滤镜
    function imageFilter(ctx, x, y) {
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
    }
    //绘制文字最终图片并显示
    function getImage(data) {
        var canvas = data.canvas;
        var ctx = canvas.getContext('2d');
        var newimg = new Image();
        newimg.src = data.base64;
        newimg.onload = function () {
            ctx.drawImage(newimg, 0, 0, canvas.width, canvas.height);
            ctx.font = 24 + "px sans-serif";
            ctx.fillStyle = "#fff";
            ctx.fillText(ele('slogan1').value, 50, 1065);
            ctx.fillText(ele('slogan2').value, 50, 1103);
            var base64 = canvas.toDataURL("image/jpeg", .5);
            ele('compose').src = base64;
            ele('compose').onload = function () {
                ele('content').style.display = "none";
                ele('error-prompt').innerHTML = "";
                ele('imgBox').style.display = "block";
            }
        }
    }
    //绘制主函数
    function generatePoster(img, next) {
        var canvas = document.createElement('canvas');
        var ClientWidth = document.documentElement.clientWidth;
        var ctx = canvas.getContext('2d');
        canvas.width = 640;
        canvas.height = 1136;
        //处理等比拉伸压缩用户图片并居中裁剪
        var imgRatio = canvas.width / canvas.height; //目标图片的宽高比
        var userimgRatio = img.width / img.height; //原始图片的宽高比
        var r = (userimgRatio > imgRatio) ? (canvas.height / img.height) : (canvas.width / img.width);
        var drawObj = {
            sx: userimgRatio > imgRatio ? (img.width * r - canvas.width) / 2 : 0,
            sy: userimgRatio > imgRatio ? 0 : (img.height * r - canvas.height) / 2,
            sWidth: canvas.width,
            sHeight: canvas.height,
            dx: 0,
            dy: 0,
            dWidth: canvas.width,
            dHeight: canvas.height
        };
        //图片居中裁剪
        ctx.drawImage(img, drawObj.sx, drawObj.sy, drawObj.sWidth, drawObj.sHeight, drawObj.dx, drawObj.dy, drawObj.dWidth, drawObj.dHeight);
        var newimg = new Image();
        newimg.src = "/src/images/poster-bg.png";
        newimg.onload = function () {
            ctx.drawImage(newimg, 0, 0, canvas.width, canvas.height);
            var base64 = canvas.toDataURL("image/jpeg", .5);
            var data = {
                base64: base64,
                canvas: canvas
            }
            next(data);
        };
    }
};