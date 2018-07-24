
var Timer = (function () {
    function Timer(millisec, repetitions, fxRappel) {
         this.delai = millisec;
         this.nbRepet = repetitions;
         this.callback = fxRappel;
         this.tick = 0;
         this.addEventListener("tick", this.callback);
     }
     
     Timer.prototype.iteration = function() {
         var timer = arguments[0];
         if(++timer.tick == timer.nbRepet) timer.stop();
         timer.dispatchEvent("tick");
     };
     
     Timer.prototype.start = function () {
         this.id = setInterval(this.iteration, this.delai, this);
         this.enCours = true;
     };
     
     Timer.prototype.stop = function () {
         if(this.id !=null) clearInterval(this.id);
         this.enCours = false;
     };
     
     Timer.prototype.reset = function ()    {
         this.stop();
         this.tick = 0;
     };
     return Timer;
 })();
 
 