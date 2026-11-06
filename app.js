const $=id=>document.getElementById(id);
const FILL=["um","uh","er","erm","ah","you know","i mean","basically","literally","actually"];
const HEDGE=["maybe","perhaps","kind of","sort of","i think","i guess","i suppose","just","a bit","probably","hopefully"];
const STOP=new Set("the a an and or but of to in on at for with is are was were be been it this that i you we they he she my your our so as if not do did have has had from by about will would can could".split(" "));
const clamp=(n,a=1,b=10)=>Math.max(a,Math.min(b,n)),r1=n=>Math.round(n*10)/10;
const esc=s=>s.replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const cnt=(t,l)=>l.reduce((n,p)=>n+((t.match(new RegExp("\\b"+p+"\\b","gi"))||[]).length),0);
const fmt=s=>String(Math.floor(s/60)).padStart(2,"0")+":"+String(Math.round(s%60)).padStart(2,"0");
let mode=1,rec=null,final="",secs=0,tick=null,on=false,file=null,last=null,asr=null;

// ---------- UI ----------
[1,2,3].forEach(n=>$("t"+n).onclick=()=>{mode=n;[1,2,3].forEach(k=>{$("t"+k).classList.toggle("on",k==n);$("p"+k).style.display=k==n?"":"none"})});
document.querySelectorAll(".chips button").forEach(b=>b.onclick=()=>$("target").value=b.dataset.m);
["s1","s2"].forEach((s,i)=>$(s).oninput=()=>$("v"+(i+1)).textContent=$(s).value);
$("rp").innerHTML=$("prof").innerHTML;
$("drop").onclick=()=>$("file").click();
["dragover","dragleave","drop"].forEach(ev=>$("drop").addEventListener(ev,e=>{e.preventDefault();$("drop").classList.toggle("ov",ev=="dragover");if(ev=="drop"&&e.dataTransfer.files[0])pick(e.dataTransfer.files[0])}));
$("file").onchange=e=>e.target.files[0]&&pick(e.target.files[0]);
function pick(f){file=f;$("fn").textContent="Selected: "+f.name+" ("+(f.size/1048576).toFixed(1)+" MB)"}
$("demo").onclick=()=>{$("pt").value=("Imagine standing on a stage with your heart racing. Last year, that was me. I had never given a speech, and I was terrified. But I learned three things that changed everything. First, preparation beats nerves. Second, stories connect people because they make us feel. Third, practice is a gift you give your audience. For example, I rehearsed my opening forty times, and um, it paid off. I think the biggest lesson was just this: you do not need to be perfect, you need to be present. ").repeat(3)+"So today, I challenge you to take one step. Find a stage, any stage, and start. Thank you.";$("pd").value="2:30"};

// live recording
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!SR){$("sup").textContent="⚠ Live recognition isn’t supported here. Use Upload or Paste instead, or try Chrome/Edge.";$("rb").disabled=true}
$("rb").onclick=()=>{
 if(on){on=false;rec.stop();clearInterval(tick);$("rb").textContent="Record again";document.body.classList.remove("recording");return}
 final="";secs=0;$("tm").textContent="00:00";rec=new SR();rec.continuous=true;rec.interimResults=true;rec.lang="en-GB";
 rec.onresult=e=>{let i="";for(let k=e.resultIndex;k<e.results.length;k++){const t=e.results[k][0].transcript;if(e.results[k].isFinal)final+=t+". ";else i+=t}$("live").textContent=(final+i)||"Listening…";$("live").style.color="var(--fg)"};
 rec.onend=()=>{if(on)try{rec.start()}catch(e){}};
 rec.onerror=e=>{if(e.error=="not-allowed"){on=false;$("live").textContent="Microphone blocked. Please allow access."}};
 on=true;rec.start();document.body.classList.add("recording");$("rb").textContent="Stop recording";
 tick=setInterval(()=>{secs++;$("tm").textContent=fmt(secs)},1000)};

// ---------- file → transcript ----------
function busy(msg,p){$("busy").style.display="block";$("bt").textContent=msg;if(p!=null)$("bp").style.width=p+"%"}
async function transcribe(f){
 busy("Loading speech model…",3);
 const {pipeline}=await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2");
 if(!asr)asr=await pipeline("automatic-speech-recognition","Xenova/whisper-tiny.en",{progress_callback:p=>{if(p.status=="progress")busy("Downloading model… "+Math.round(p.progress)+"%",p.progress*0.4)}});
 busy("Reading audio…",45);
 const ctx=new AudioContext({sampleRate:16000});
 const ab=await ctx.decodeAudioData(await f.arrayBuffer());
 const dur=ab.duration;
 busy("Transcribing "+fmt(dur)+" of speech… this can take a few minutes",50);
 let out;const o={chunk_length_s:30,stride_length_s:5};
 try{out=await asr(ab.getChannelData(0),{...o,return_timestamps:"word"})}catch(e){out=await asr(ab.getChannelData(0),{...o,return_timestamps:true})}
 let pauses=0;const c=out.chunks||[];
 for(let i=1;i<c.length;i++){const g=(c[i].timestamp[0]||0)-(c[i-1].timestamp[1]||0);if(g>=0.8)pauses++}
 return{text:out.text,dur,pauses};
}

$("go").onclick=async()=>{
 let text,dur,pauses=null;
 try{
 if(mode==1){
  if(!file)return alert("Please choose a file first.");
  if(/\.(txt|md|srt|vtt)$/i.test(file.name)||file.type=="text/plain"){
   text=(await file.text()).replace(/^\d+\s*$/gm,"").replace(/[\d:,.]+ --> [\d:,.]+.*$/gm,"").replace(/WEBVTT/g,"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();
  }else{$("go").disabled=true;const r=await transcribe(file);text=r.text;dur=r.dur;pauses=r.pauses}
 }else if(mode==2){
  if(on)$("rb").click();if(!final||secs<20)return alert("Please record at least 20 seconds.");text=final;dur=secs;
 }else{text=$("pt").value.trim()}
 const wc=(text.match(/[a-z'’]+/gi)||[]).length;
 if(wc<100)return alert("Need at least 100 words for a meaningful evaluation.");
 if(!dur){const m=(mode==3?$("pd").value:"").match(/^(\d+):(\d{1,2})$/);dur=m?+m[1]*60+ +m[2]:wc/140*60}
 show(analyse(text,dur,pauses,+$("target").value||7,+$("s1").value,+$("s2").value));
 }catch(e){console.error(e);alert("Sorry, this file couldn’t be processed ("+(e.message||e)+"). Try audio-only, a smaller file, or paste the transcript.")}
 $("go").disabled=false;$("busy").style.display="none";
};

// ---------- analysis ----------
function analyse(text,dur,pauses,target,selfP,selfM){
 const words=(text.toLowerCase().match(/[a-z'’]+/g)||[]),n=words.length;
 const sents=text.split(/[.!?]+\s/).map(s=>s.trim()).filter(s=>s.split(/\s+/).length>1);
 const lens=sents.map(s=>s.split(/\s+/).length),avg=lens.reduce((a,b)=>a+b,0)/(lens.length||1);
 const sd=Math.sqrt(lens.reduce((a,b)=>a+(b-avg)**2,0)/(lens.length||1));
 const min=dur/60,wpm=Math.round(n/min);
 const fill=cnt(text,FILL)+Math.round(cnt(text,["like"])*0.4),fr=fill/n*100;
 const hedge=cnt(text,HEDGE),hr=hedge/n*100;
 const head=text.slice(0,350),tail=text.slice(-350);
 const hook=/\?|imagine|picture this|what if|when i |last (year|week|month)|once |remember when|\b\d{2,}\b/i.test(head);
 const close=/remember|so (let|today|next)|thank you|i challenge|i invite|take |next time|start|begin/i.test(tail);
 const sign=cnt(text,["first","second","third","next","finally","because","therefore","however","for example","for instance","in conclusion"]);
 const qn=(text.match(/\?/g)||[]).length;
 const tri={};for(let i=0;i<n-2;i++){const g=words.slice(i,i+3);if(g.filter(w=>!STOP.has(w)).length>=2){const k=g.join(" ");tri[k]=(tri[k]||0)+1}}
 const reps=Object.values(tri).filter(v=>v>=2).length;
 const content=words.filter(w=>!STOP.has(w)&&w.length>3),freq={};content.forEach(w=>freq[w]=(freq[w]||0)+1);
 const over=Object.entries(freq).filter(([w,c])=>c/n>0.012&&c>4).sort((a,b)=>b[1]-a[1]).slice(0,4);
 const slice=words.slice(0,300),ttr=new Set(slice).size/slice.length;
 const longR=words.filter(w=>w.length>=8).length/n*100;
 const you=words.filter(w=>w=="you"||w=="your").length/n*100;
 const me=words.filter(w=>w=="i"||w=="my"||w=="me").length/n*100;
 const ex=cnt(text,["for example","for instance","imagine","picture"])+(text.match(/\b\d+\b/g)||[]).length;
 const cta=/you (can|should|must|need)|let’s|let's|i challenge|i invite|join me|today/i.test(tail);
 const prof=/\b(fuck|shit|damn|bitch|crap)\b/i.test(text);
 const dev=Math.abs(min-target)/target,ppm=pauses==null?null:pauses/min;
 const C=[];let s;
 s=4+(hook?1.5:0)+(close?1.5:0)+Math.min(2,sign/(3*Math.max(1,min/4)))+(n>=250?1:0)+(n>=600?.5:0);
 C.push(["Speech Development",s,hook&&close?"Clear opening and closing frame your message.":"",!hook?"Open with a hook: a question, vivid moment or surprising fact in the first two sentences.":!close?"Land the ending: finish with a memorable takeaway or call back to your opening.":sign<4*Math.max(1,min/4)?"Add signposts (first, because, however, finally), especially in a longer speech, so listeners can follow.":""]);
 s=4+(me>=3&&me<=9?1.5:0)+(qn>=2?1:0)+(reps>=1?1:0)+(cta?1:0)+Math.min(1.5,ex/(3*Math.max(1,min/5)));
 C.push(["Speech Effectiveness",s,ex>=3&&me>=3?"Personal story and concrete examples make the message engaging.":"",me<3?"Weave in a personal story using “I” moments to build connection.":ex<3?"Add concrete examples, numbers or an “imagine…” scene.":!cta?"End with a clear call to action.":"Use rhetorical questions or rule-of-three repetition for punch."]);
 s=4+(ttr>.5?1.5:ttr>.42?.7:0)+(longR>8?1.5:longR>5?.7:0)+(you>=1&&you<=5?1.5:0)+(ex>=3?1.5:0);
 C.push(["Speech Value",s,you>=1?"Audience-centred language (“you”) shows the idea matters to listeners.":"",you<1?"Speak to the audience more: say what’s in it for “you”.":"Sharpen your core insight: what one idea should listeners remember?"]);
 C.push(["Physical Delivery",selfP,selfP>=7?"You rate your gestures, eye contact and movement highly.":"",selfP<7?"Record on video and review: purposeful gestures, steady eye contact and deliberate stage movement.":""]);
 s=5+(wpm>=120&&wpm<=160?3:(wpm>=100&&wpm<=180?1.5:-1))+(fr<1?1.5:fr<2.5?.5:fr>4?-1.5:0)+(sd>5?1:0)+(ppm!=null&&ppm>=2&&ppm<=10?1:0);
 C.push(["Voice",s,wpm>=120&&wpm<=160?`Pace of ${wpm} wpm sits in the comfortable range.`:ppm>=2&&ppm<=10?`Good use of pauses (about ${Math.round(ppm)} per minute).`:"",wpm>160?`Pace is fast (${wpm} wpm). Add deliberate pauses after key points.`:wpm<120?`Pace is slow (${wpm} wpm). Add energy and vary pitch.`:ppm!=null&&ppm<2?"Use more deliberate pauses (1 second or more) after key points.":sd<=5?"Vary sentence length and vocal pitch.":""]);
 const m=6+(hr<.8?1.5:hr>2?-2:0);
 C.push(["Manner",(m+selfM)/2,hr<1?"Confident, direct language with few hedges.":"",hr>=1?`Found ${hedge} hedge words (“just”, “kind of”, “I think”). Replace with direct statements.`:selfM<7?"Work on energy and connection: smile, project, speak to individuals.":""]);
 s=7+(dev<=.15?2:dev<=.3?.5:-1.5)-(prof?2:0);
 C.push(["Appropriateness",s,dev<=.15?`Timing of ${fmt(dur)} is right on target.`:"",dev>.15?`Timing was ${fmt(dur)} against a ${target}-minute target. Adjust content to fit.`:prof?"Remove strong language for a general audience.":""]);
 s=6+(avg>=10&&avg<=22?1.5:0)+(fr<2?1:0)-Math.min(2,over.length*.7)+(ttr>.5?1:0);
 C.push(["Correct Language",s,avg>=10&&avg<=22&&fr<2?"Clean, readable sentences with few fillers.":"",fr>=2?`About ${fill} filler words (${r1(fr)} per 100). Replace each with a silent pause.`:over.length?`Overused words: ${over.map(o=>o[0]).join(", ")}. Find synonyms.`:avg>22?`Sentences average ${Math.round(avg)} words. Shorten for clarity.`:"Check grammar with a trusted evaluator."]);
 C.forEach(c=>c[1]=r1(clamp(c[1])));
 return{C,n,wpm,fill,fr,hedge,avg,dur,text,pauses,hook,close,ex,me,cta,dev,hr,type:$("type").value};
}
const DRILL={
"Speech Development":"Rewrite your first two sentences three ways (question, story, bold claim) and keep the one that makes you lean forward. For longer speeches, add a one-line signpost before each main point and an ending that echoes your opening.",
"Speech Effectiveness":"Tell one personal moment in 60 seconds: beginning, turning point, lesson. Add one rule-of-three line and one direct question to the audience.",
"Speech Value":"Finish the sentence “After this speech, my audience will…”. Cut anything that doesn’t serve it and add one example per main point.",
"Physical Delivery":"Record a one-minute video with the sound off. Do your hands, face and feet tell the same story? Plan three gestures tied to key words.",
"Voice":"Read a paragraph at three speeds and mark pauses with “/”. Aim for 130–150 wpm with a full pause after each key point.",
"Manner":"Underline every “just”, “kind of” and “I think” in your script and replace it with a firm statement. Rehearse the first 30 seconds standing, smiling, eyes up.",
"Appropriateness":"Time each section and set a budget (opening 15%, body 70%, close 15%). Trim your weakest example if you overrun.",
"Correct Language":"Replace each filler with a silent beat. Record 60 seconds on any topic, count fillers, and beat your number daily."};
const col=v=>v>=7.5?"var(--ok)":v>=5.5?"var(--warn)":"var(--bad)";

// ---------- results ----------
function show(A){
 last=A;const tot=r1(A.C.reduce((a,c)=>a+c[1],0)/8*10),T=A.title=$("title").value||"Your speech";A.tot=tot;
 $("res").style.display="block";
 $("rt").textContent=T+" – "+(tot>=80?"Outstanding":tot>=70?"Strong":tot>=60?"Developing well":"Foundation stage");
 $("rs").textContent=`Overall benchmark across the eight Toastmasters contest criteria · ${A.type}`;
 $("ring").style.setProperty("--p",tot);$("ov").textContent=Math.round(tot);
 const S=[[A.n,"Words"],[A.wpm,"Words / min"],[fmt(A.dur),"Duration"],[A.fill,"Filler words"],[A.hedge,"Hedges"],[A.pauses==null?"n/a":A.pauses,"Pauses"]];
 $("st").innerHTML=S.map(s=>`<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("");
 $("cr").innerHTML=A.C.map(c=>`<div class="crit"><div class="h"><span>${c[0]}</span><span>${c[1]}/10</span></div><div class="bar"><i style="width:${c[1]*10}%;background:${col(c[1])}"></i></div><p>${c[2]||c[3]||""}</p></div>`).join("");
 $("sg").innerHTML=A.C.filter(c=>c[2]).map(c=>`<li><b>${c[0]}:</b> ${c[2]}</li>`).join("")||"<li>Keep practising. Strengths will emerge as scores rise.</li>";
 $("op").innerHTML=A.C.filter(c=>c[3]&&c[1]<8).map(c=>`<li><b>${c[0]}:</b> ${c[3]}</li>`).join("")||"<li>Excellent. Refine nuance with a human evaluator.</li>";
 const low=[...A.C].sort((a,b)=>a[1]-b[1]).slice(0,3);
 $("ns").innerHTML=low.map(c=>`<li><b>Improve ${c[0]} (${c[1]}/10).</b> ${c[3]||"Polish further."}</li>`).join("");
 $("cs").innerHTML=`<p><b>Your 3-step practice plan</b> (lowest scores first):</p>`+low.map((c,i)=>`<p><b>${i+1}. ${c[0]}.</b> ${DRILL[c[0]]}</p>`).join("")+`<p><b>Before your next speech:</b> rehearse aloud once, record it, and re-evaluate here to watch your score move.</p>`;
 let h=esc(A.text);
 h=h.replace(new RegExp("\\b("+FILL.join("|")+")\\b","gi"),'<mark class="h">$1</mark>').replace(new RegExp("\\b("+HEDGE.join("|")+")\\b","gi"),m=>"<mark>"+m+"</mark>");
 $("tx").innerHTML=h;
 let H=[];try{H=JSON.parse(localStorage.getItem("cs_h")||"[]")}catch(e){}
 const prev=H.length?H[H.length-1].s:null;
 H.push({s:Math.round(tot)});H=H.slice(-10);try{localStorage.setItem("cs_h",JSON.stringify(H))}catch(e){}
 $("dl").textContent=prev==null?"First evaluation saved. Come back after your next speech to see your growth.":(Math.round(tot)>=prev?"▲ ":"▼ ")+Math.abs(Math.round(tot)-prev)+" points vs your previous speech.";
 draw(H);
 const B=[];if(A.wpm>=125&&A.wpm<=155)B.push("🎯 Pace Pro");if(A.fr<1)B.push("🧼 Filler-Free");if(A.hook)B.push("🪝 Strong Opener");if(A.close&&A.cta)B.push("🏁 Powerful Close");if(A.ex>=4&&A.me>=3)B.push("📖 Storyteller");if(A.dev<=.1)B.push("⏱ Time Master");if(A.hr<.8)B.push("💪 Confident Voice");if(A.dur>=360)B.push("🏔 Long-Form Speaker");if(tot>=75)B.push("🏆 Contest Ready");if(H.length>=3)B.push("🔥 Consistent Practiser");
 $("bd").innerHTML=B.length?B.map(b=>`<span>${b}</span>`).join(""):"<span>🌱 Keep going: your first badge is close!</span>";
 const msg=`I just scored ${Math.round(tot)}/100 on my speech with Clear Speech, a free speech evaluation tool. Try it: ${location.href}`;
 $("li").href="https://www.linkedin.com/sharing/share-offsite/?url="+encodeURIComponent(location.href);
 $("wa").href="https://wa.me/?text="+encodeURIComponent(msg);
 $("res").scrollIntoView({behavior:"smooth"});
}
function draw(H){$("hs").innerHTML=H.map(x=>`<div style="height:${x.s}%"><small>${x.s}</small></div>`).join("")}
$("clr").onclick=()=>{try{localStorage.removeItem("cs_h")}catch(e){}draw([])};

// ---------- score card ----------
$("dlc").onclick=()=>{
 if(!last)return;const c=document.createElement("canvas");c.width=c.height=1080;const x=c.getContext("2d");
 const g=x.createLinearGradient(0,0,1080,1080);g.addColorStop(0,"#312e81");g.addColorStop(1,"#4f46e5");x.fillStyle=g;x.fillRect(0,0,1080,1080);
 x.fillStyle="#fff";x.font="700 44px system-ui,sans-serif";x.fillText("Clear Speech",70,100);
 x.font="500 34px system-ui,sans-serif";x.fillStyle="#c7d2fe";x.fillText((last.title||"My speech").slice(0,40),70,160);
 x.fillStyle="#fff";x.font="800 220px system-ui,sans-serif";x.fillText(Math.round(last.tot),70,380);
 x.font="600 44px system-ui,sans-serif";x.fillText("/ 100 overall",70,440);
 last.C.forEach((c,i)=>{const y=520+i*58;x.font="500 28px system-ui,sans-serif";x.fillStyle="#e0e7ff";x.fillText(c[0],70,y);
  x.fillStyle="rgba(255,255,255,.2)";x.fillRect(430,y-24,480,24);x.fillStyle="#a5b4fc";x.fillRect(430,y-24,48*c[1],24);x.fillStyle="#fff";x.fillText(c[1],930,y)});
 x.fillStyle="#c7d2fe";x.font="500 28px system-ui,sans-serif";x.fillText(`${last.wpm} wpm · ${fmt(last.dur)} · ${last.fill} fillers`,70,1010);
 const a=document.createElement("a");a.download="clear-speech-score.png";a.href=c.toDataURL("image/png");a.click();
};
