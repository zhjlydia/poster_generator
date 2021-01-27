# poster_generator
canvas海报生成器




# 原生js小项目 - canvas海报生成器







### 1.背景



&emsp;&emsp;很久之前做过一个营销类移动端h5项目-海报生成器，上传用户本地图片合成海报并支持下载。





### 2.几个重点



- 上传本地图片并支持预览



- 处理ios照片翻转



- 使用canvas对图片等比拉伸缩放并居中裁剪



- 使用canvas绘制图片以及文本



- 输出base64并支持下载



### 3.上传图片



&emsp;&emsp;废话不多说，使用html的 ``` <input  type="file" /> ``` 标签可以支持文件上传，前端上传验证的话，设置```accept="image/*"```将文件类型限制为图像。




```

<div className="btnUpload" style={{'display':this.state.hasFile && this.state.isUploaded?'none':'block'}}>

　　<input className="upload" type="file" accept="image/ * " ref="imgInput" onChange={this.uploadImg}/>

　　<svg className="cameraIcon">

　　　　<use xlinkHref="#camera"></use>

　　</svg >

</div>



```



&emsp;&emsp;获取当前上传的图片。



```

var file = event.target.files[0];



```



&emsp;&emsp;要完成本地预览图片，需要使用FileReader对象读取所要处理的文件数据，使用readAsDataURL将文件以Data URL形式进行读入页面。同时为了处理ios下照片翻转角的问题，需要先对翻转的照片进行一个修正。使用exif-js这个库可以获取照片的信息，获得翻转角，然后使用canvas画布对图片进行翻转矫正。





```

//上传图片

    uploadImg = event => {

        var that = this;

        var file = event.target.files[0];

        if (!file) {

            return;

        }

        var orientation = "";

        //EXIF js 可以读取图片的元信息 https://github.com/exif-js/exif-js

        EXIF.getData(file, function () {

            orientation = EXIF.getTag(this, 'Orientation');

        });

        var reader = new FileReader();

        // 将文件以Data URL形式进行读入页面

        reader.readAsDataURL(file);

        reader.onload = function () {

            var sourceImg = new Image();

            sourceImg.onload = function () {

                var imgRadio=sourceImg.width/sourceImg.height;

                var imgStyle={

                    'width':imgRadio>1?'100%':'auto',

                    'height':imgRadio<1?'100%':'auto'

                }

                that.setState({isUploaded: true, sourceImg: sourceImg, hasFile: true,previewImgStyle:imgStyle})

            };

            //处理iOS照片旋转

            (async function (context) {

                sourceImg.src = orientation && orientation != "1"

                    ? await that.rotateImage(context.result, orientation)

                    : context.result;

            })(this);

        };

    }

//处理ios照片翻转

    rotateImage = (img, dir) => {

        return new Promise((resolve, reject) => {

            var image = new Image();

            var that = this;

            image.onload = function () {

                var degree = 0,

                    drawWidth=this.naturalWidth,

                    drawHeight=this.naturalHeight,

                    width,

                    height;

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

                resolve(canvas.toDataURL("image/jpeg", 1));

            }

            image.src = img;

        });

    }



```



html



```

<div className="preview-box" style={{'display':this.state.hasFile && this.state.isUploaded?'block':'none'}} onClick={this.changeImg}>

   <img src={this.state.sourceImg.src} style={this.state.previewImgStyle} className="db-img"/>

</div>



```






### 4.裁剪图片



&emsp;&emsp;到此完成了图片的上传和预览，接下来处理海报合成，背景图是640*1136大小的，但是上传的图片可以是五花八门的，有可能是方的，也有可能是非常长的- -，需要保证图片不变形并显示中心部分，因此需要比较照片的宽高比与背景的宽高比，并拉伸压缩至宽度或高度与背景图片相同，然后裁剪中间部分。



```

 var canvas = document.createElement('canvas');

       var ctx = canvas.getContext('2d');

        canvas.width = 640;

        canvas.height = 1136;

        //处理等比拉伸压缩用户图片并居中裁剪

        var imgRatio = canvas.width / canvas.height; //目标图片的宽高比

        var userimgRatio = that.state.sourceImg.width / that.state.sourceImg.height; //原始图片的宽高比

        var r = (userimgRatio > imgRatio)

            ? (canvas.height / that.state.sourceImg.height)

            : (canvas.width / that.state.sourceImg.width);

        var drawObj = {

            sx: userimgRatio > imgRatio

                ? (that.state.sourceImg.width - canvas.width / r) / 2

                : 0,

            sy: userimgRatio > imgRatio

                ? 0

                : (that.state.sourceImg.height - canvas.height / r) / 2,

            sWidth: canvas.width / r,

            sHeight: canvas.height / r,

            dx: 0,

            dy: 0,

            dWidth: canvas.width,

            dHeight: canvas.height

        };

        //图片居中裁剪

        ctx.drawImage(that.state.sourceImg, drawObj.sx, drawObj.sy, drawObj.sWidth, drawObj.sHeight, drawObj.dx, drawObj.dy, drawObj.dWidth, drawObj.dHeight);



```

canvas的drawImage方法总共有9个参数



&emsp;&emsp;如图示，上传了一张尺寸小且为正方形的图片，先根据背景图片计算宽高比，在用户图片中裁剪出一个宽高比与背景图片宽高比一样的最大范围，并且裁剪图片中心部分，获得开始裁剪的点，左上角这个点x坐标为(that.state.sourceImg.width - canvas.width / r) / 2，y坐标为0，对应sx和sy参数，被剪切图像的宽高是中间部分的宽高（四个黄点所围），即参数中的swidth为canvas.width / r，sheight为canvas.height / r，最终图片放置位置为铺满canvas，即x=0,y=0，最终图片大小即为canvas的大小，会拉伸图片铺满canvas，最终实现了“获取用户图片中心部分并铺满背景的效果”




### 5.绘制图片



&emsp;&emsp;最后将背景图与上传的图片绘制在一起，并生成base64格式，可以长按保存。



```



var newimg = new Image();

        newimg.src = "/src/images/bg.png";



        newimg.onload = function () {

            ctx.drawImage(newimg, 0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "#fff";

            ctx.font = 36 + "px sans-serif";

            ctx.fillText(that.state.slogan1, 50, 1000);

            ctx.fillText(that.state.slogan2, 50, 1070);

            that.setState({

                resultImgUrl: canvas.toDataURL("image/jpeg", .5),

                isGenerated: true

            })

        };

```

