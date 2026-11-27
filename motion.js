(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const root = document.documentElement;
  const cover = document.querySelector("#cover");
  const title = cover.querySelector("h1");
  const wordmark = document.querySelector("header .identity span");
  const displacement = document.querySelector("#ink-ripple feDisplacementMap");
  let scrollFrame = 0;

  function revealTitle() {
    scrollFrame = 0;
    const travel = Math.min(180, innerHeight * .22);
    const progress = reduced.matches ? 1 : Math.min(1, Math.max(0, scrollY / travel));
    title.style.opacity = progress;
    wordmark.style.opacity = progress;
    title.style.transform = progress === 1 ? "none" : `translateY(${(1-progress)*17}px) scaleY(${1+(1-progress)*.14})`;
    displacement.setAttribute("scale", String(74 * (1-progress)**1.5));
    title.style.filter = progress > 0 && progress < 1 ? "url(#ink-ripple)" : "none";
  }
  function queueReveal() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(revealTitle);
  }
  addEventListener("scroll",queueReveal,{passive:true});
  addEventListener("resize",queueReveal);
  reduced.addEventListener("change",queueReveal);
  revealTitle();

  for (const [area, image] of [[cover,document.querySelector("#portrait")],
    [document.querySelector("#bipolar figure"),document.querySelector("#bipolar figure img")]]) {
    area.addEventListener("pointermove", event => {
      if (!finePointer.matches || reduced.matches) return;
      const box = area.getBoundingClientRect();
      const x = (event.clientX-box.left)/box.width*2-1;
      const y = (event.clientY-box.top)/box.height*2-1;
      image.style.setProperty("--dx",x*10+"px");
      image.style.setProperty("--dy",y*8+"px");
      image.style.setProperty("--rx",-y*4+"deg");
      image.style.setProperty("--ry",x*5+"deg");
    },{passive:true});
    area.addEventListener("pointerleave",() => {
      for (const name of ["--dx","--dy","--rx","--ry"]) image.style.removeProperty(name);
    });
  }

  const vinyl = document.createElement("div");
  vinyl.className="vinyl";
  vinyl.setAttribute("aria-hidden","true");
  document.body.append(vinyl);
  const hideCursor = () => root.classList.remove("vinyl-active");
  document.addEventListener("pointermove",e => {
    if (!finePointer.matches || reduced.matches || e.pointerType==="touch") return hideCursor();
    vinyl.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
    root.classList.add("vinyl-active");
  },{passive:true});
  root.addEventListener("pointerleave",hideCursor);
  window.addEventListener("blur",hideCursor);
  document.addEventListener("keydown",hideCursor);

  const heading = document.querySelector("#artist h2");
  const stage = document.createElement("div");
  stage.className="voice-stage voice-ready";
  heading.before(stage);
  stage.append(heading);
  const wave = document.createElement("div");
  wave.className="waveform";
  wave.setAttribute("aria-hidden","true");
  for(let i=0;i<38;i++){
    const bar=document.createElement("i");
    bar.style.setProperty("--peak",(12+60*Math.abs(Math.sin(i*1.73)*Math.sin(i*.27)))+"%");
    bar.style.setProperty("--lag",i*8+"ms");
    wave.append(bar);
  }
  stage.append(wave);
  const entrances = new IntersectionObserver(entries=>{
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add(entry.target===stage ? "is-playing" : "charging");
      entrances.unobserve(entry.target);
    }
  },{threshold:.15});
  entrances.observe(stage);
  for (const bar of document.querySelectorAll(".bar")) {
    const liquid=document.createElement("i");
    liquid.className="fluid";
    liquid.setAttribute("aria-hidden","true");
    bar.prepend(liquid);
    entrances.observe(bar);
  }

  // Keep the original formatted number available to assistive technology.
  const counters = new IntersectionObserver(entries=>{
    for (const {target, isIntersecting} of entries) if(isIntersecting) {
      counters.unobserve(target);
      const final = target.dataset.final;
      const precision = (final.split(".")[1] || "").length;
      const start = performance.now();
      function tick(time) {
        if (!target.isConnected) return;
        const t = reduced.matches ? 1 : Math.min(1,(time-start)/850);
        target.textContent = t===1 ? final : (Number(final)*(1-(1-t)**3)).toFixed(precision).padStart(final.length,"0");
        if (t<1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  });
  function prepareNumbers(area) {
    const walker = document.createTreeWalker(area,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) {
      const node=walker.currentNode;
      if (/\d/.test(node.data) && !node.parentElement.closest("script,style,svg,.counter,.sr-value")) nodes.push(node);
    }
    for(const node of nodes){
      const parts = node.data.split(/(\d+(?:\.\d+)?)/g);
      const fragment = document.createDocumentFragment();
      parts.forEach((part,i)=>{
        if (i%2===0) return fragment.append(part);
        const visual = document.createElement("span");
        visual.className="counter";
        visual.dataset.final=part;
        visual.textContent=reduced.matches ? part : part.replace(/\d/g,"0");
        visual.setAttribute("aria-hidden","true");
        const spoken=document.createElement("span");
        spoken.className="sr-value";
        spoken.textContent=part;
        fragment.append(visual,spoken);
        counters.observe(visual);
      });
      node.replaceWith(fragment);
    }
  }
  prepareNumbers(document.body);
  // Selection replaces these labels with the newly selected record's figures.
  for(const id of ["views","selected","counter"]){
    const label=document.getElementById(id);
    new MutationObserver(()=>{
      if (!label.querySelector(".counter")) prepareNumbers(label);
    }).observe(label,{childList:true});
  }
})();
