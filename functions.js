    /*PAGE*/
    function setFavicon(src_img){
        var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = src_img;
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    function addCssFile(href_css){
        var link_css =  document.createElement('link');
        link_css.href = href_css;
        link_css.rel = 'stylesheet';
        link_css.type = 'text/css';
        document.head.appendChild(link_css);
    }
    function addJsFile(src_js){
        var script_js =  document.createElement('script');
        script_js.src = src_js;
        script_js.type = 'text/javascript';
        document.head.appendChild(script_js);
    }
    function getParam(name_param){
        try{
            var url_string = window.location.href;
            var url = new URL(url_string);
            return url.searchParams.get(name_param);
        }catch(e){
            return "";
        }
    }
    function openLinkOnNewTab(href_url) {
        var a = document.createElement('a');
        a.setAttribute('target','_blank');
        a.setAttribute('href',href_url);
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /*FILES*/
    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
    function readTextFile(file, fun) {
        var reader = new FileReader();
        reader.onload = function(){
          var text = reader.result;

          var output = $("<div>").attr({id:'output-file-csv'}).css({display:'none'}).text(text);
          $("body").prepend(output);
        };
        reader.readAsText(file);
        waitForElementToDisplay("#output-file-csv",1,function(){
            fun($("#output-file-csv").text());
        });

    }
    
    /*JAVA*/
    function sizeArrayObj(obj) {
        var count = 0;
        for (var p in obj) {
          obj.hasOwnProperty(p) && count++;
        }
        return count; 
    }
    function forSync(i,max,fun_with_return_true,fun){
        if(i <= max){
            if(fun_with_return_true(i)){
                i++;
                forSync(i,max,fun_with_return_true,fun);
            }else{
                console.log('for Sync Break after execution '  + i);
            }
        }else{
            fun();
        }
    }
    function colocaNoCtrlC(text) {
        var t = $("<input>");
        t.id = "text_copied_9876", $("body").append(t);
        t.val(text).select();
        t.focus();
        document.execCommand("copy", !1);
        t.remove();
    }
    
    /*CONVERSÕES*/
    function toHHMMSS(sec_str) {
        var sec_num = parseInt(sec_str, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        return hours+':'+minutes+':'+seconds;
    };

    /*ELEMENTS*/
    function waitForRecaptcha(a,c){
        if(c === null | c === undefined){ c = 0; }
        c++;
        /*console.log(c);*/
        try{
            if(document.getElementById("g-recaptcha-response").value === ""){
                if(c <= 500){
                    setTimeout(function() {
                        waitForRecaptcha(a,c);
                    }, (1000));
                }else{
                    location.reload();
                }
            }else{
                a();
            }
        }catch(ee){
            location.reload();
        }
    }
    function waitRecpatchaResponse(a,c){
        if(c === undefined | c === null){ c = 0;}
        c++;
        
        var response = "";
        try {
            response = grecaptcha.getResponse();
        } catch (e) {}
        
        if(response === ""){
            if(c <= 500){
                setTimeout(function() {
                    waitRecpatchaResponse(a,c);
                }, (1000));
            }else{
                location.reload();
            }
        }else{
            a();
        }
    }
    function waitElement(e,fun,maxWait,funMaxWait){
        if(maxWait !== null & funMaxWait !== null){
            waitElementWithCount(e,fun,maxWait,funMaxWait,0);
        }else{
            waitElementWithOutCount(e,fun);
        }
    }
    function waitElementWithCount(e,fun,maxWait,funMaxWait,count){
        count++;
        var r = document.querySelector(e);
        if(r === null){
            if(count <= maxWait){
                setTimeout(function(){
                    waitElementWithCount(e,fun,maxWait,funMaxWait,count);
                },1000);
            }else{
                funMaxWait();
            }
        }else{
            fun(r);
        }
    }
    function waitElementWithOutCount(e,fun){
        var r = document.querySelector(e);
        if(r === null){
            setTimeout(function(){
                waitElement(e,fun);
            },1000);
        }else{
            fun(r);
        }
    }
    function waitForElementToDisplay(e, s, a) {
        if(a===null){
           a = s;
           s = 1;
        }
        a = a || !1, null != document.querySelector(e) ? 0 != a && a() : setTimeout(function() {
            waitForElementToDisplay(e, s, a);
        }, (s * 1000));
    }
    function waitPageLoadingForSeconds(seconds,a) {
        if(seconds > 0){
            seconds--;
            setTimeout(function() {
                waitPageLoadingForSeconds(seconds,a);
            }, 1000);
        }else{
            a();
        }
    }
    
    /*COOKIES*/
    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    function delete_cookie(cname) {
        setCookie(cname, false, -1);
    }
    
    /*GETTERS*/
    function getDayNowDDMMYYY(){
        var d = new Date();
        return  d.getDate() + "/" +  (d.getMonth() + 1) + "/" + d.getFullYear();
    }
