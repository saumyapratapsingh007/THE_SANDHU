const records = [
  ["Deewane","Melody / House Navior","The melodic entry point. Built for repeat listening.","171M+","B-2BCSxnyHA"],
  ["My Prime","Signature / Naveezy","The confidence, the pen, the unmistakable delivery.","110M+","SeS00eJnguo"],
  ["Kath Lagda","Collaboration / Bipolar","A cross-language connection with Dhanda Nyoliwala.","69M+","nMozMETeCyw"],
  ["Unbothered","Melodic rap / Naveezy","A different pace. The same distinctive voice.","63M+","cM69h3upXec"],
  ["Hood Famous","Rap / Relentless","The direct, commanding side of his sound.","60M+","UTMh-_wh1xE"]
];
const get = id => document.getElementById(id);
const count = index => String(index + 1).padStart(2,"0");
const tracks = records.map(([name, category, description, views], index) => {
  const row = document.createElement("button");
  row.className = "track";
  row.innerHTML = `<span class="index">${count(index)}</span><span><label>${category}</label><strong>${name}</strong><span class="description">${description}</span></span><span class="stat"><strong>${views}</strong><small>LIFETIME VIEWS</small></span>`;
  row.onclick = () => {
    selectRecord(index);
    if (matchMedia("(max-width:800px)").matches) document.getElementById("player").scrollIntoView({block:"start"});
  };
  get("tracks").append(row);
  return row;
});
function selectRecord(index) {
  const [name,,,views,id] = records[index];
  tracks.forEach((row,i) => row.setAttribute("aria-pressed", String(i === index)));
  get("selected").textContent = count(index) + " / " + name;
  get("counter").textContent = "Selected video / " + count(index) + " of 05";
  get("views").textContent = views;
  get("youtube").href = "https://www.youtube.com/watch?v=" + id;
  const play = document.createElement("button");
  play.innerHTML = `<img alt="" src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg"><span><b aria-hidden="true">▶</b>Play ${name}</span>`;
  if (index === 0) {
    play.querySelector("img").src = "media/deewane.jpg";
    play.className = "reference-poster";
    play.setAttribute("aria-label","Play Deewane");
  }
  play.onclick = () => {
    const frame = document.createElement("iframe");
    frame.title = name + " by Navaan Sandhu";
    frame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    get("screen").replaceChildren(frame);
    frame.focus();
  };
  get("screen").replaceChildren(play);
}
selectRecord(0);

// The film-grain layer responds to the pointer while keeping all text in the DOM.
function lightPortrait() {
  const canvas = document.querySelector("canvas");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) return;
  const gl = canvas.getContext("webgl",{alpha:true,antialias:false});
  if (!gl) return;
  const program = gl.createProgram();
  function attach(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    gl.attachShader(program,shader);
  }
  attach(gl.VERTEX_SHADER,"attribute vec2 point; varying vec2 uv; void main(){uv=point*.5+.5;gl_Position=vec4(point,0.,1.);}");
  attach(gl.FRAGMENT_SHADER,`precision mediump float;
    varying vec2 uv;uniform vec2 pointer;uniform float phase;
    void main(){float grain=fract(sin(dot(mod(gl_FragCoord.xy,251.),vec2(12.7,33.1)))*413.7);
    float light=1.-smoothstep(0.,.75,distance(uv,pointer));
    float a=.018*grain+.047*light*(.85+.15*sin(phase));
    gl_FragColor=vec4(vec3(.96,.78,.46)*a,a);}`);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program,"point");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const pointer = gl.getUniformLocation(program,"pointer");
  const phase = gl.getUniformLocation(program,"phase");
  let x=.55, y=.7, visible=false, last=0, frame=0;
  function render(time) {
    if (!visible || document.hidden || reduced.matches) {frame=0;return;}
    if(time-last>65){
      gl.uniform2f(pointer,x,y);
      gl.uniform1f(phase,time*.0005);
      gl.drawArrays(gl.TRIANGLES,0,3);
      last=time;
    }
    frame=requestAnimationFrame(render);
  }
  function resume(){if(!frame) frame=requestAnimationFrame(render);}
  new ResizeObserver(() => {
    canvas.width=Math.max(1,Math.round(canvas.clientWidth));
    canvas.height=Math.max(1,Math.round(canvas.clientHeight));
    gl.viewport(0,0,canvas.width,canvas.height);
  }).observe(canvas);
  new IntersectionObserver(([entry]) => {visible=entry.isIntersecting;resume();}).observe(canvas);
  document.addEventListener("visibilitychange",resume);
  reduced.addEventListener("change",()=>{canvas.style.opacity=reduced.matches?"0":"1";resume();});
  get("cover").addEventListener("pointermove",event=>{
    const box=canvas.getBoundingClientRect();
    x=(event.clientX-box.left)/box.width;y=1-(event.clientY-box.top)/box.height;
  },{passive:true});
  canvas.style.opacity="1";
}
lightPortrait();
