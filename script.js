function H(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>')}
function T(t){var h=Math.floor(t/3600),m=Math.floor((t%3600)/60),s=t%60;if(h>0)return h+'h '+m+'m '+s+'s';if(m>0)return m+'m '+s+'s';return s+'s'}
function G(p){if(p>=80)return'exc';if(p>=60)return'gd';if(p>=40)return'avg';return'pr'}

function QS(){this.answer=null;this.review=false}
QS.prototype.pick=function(v){this.answer=v;this.review=false};
QS.prototype.tog=function(){this.review=!this.review};
QS.prototype.clr=function(){this.answer=null};
QS.prototype.has=function(){return this.answer!==null};
QS.prototype.st=function(cv){
    if(cv===null||cv===undefined)return'ungraded';
    if(this.answer===null)return'skipped';
    return this.answer===cv?'correct':'incorrect';
};

function SS(n){this.name=n;this.total=0;this.correct=0;this.incorrect=0;this.skipped=0;this.ungraded=0}
SS.prototype.add=function(s){this.total++;if(s==='correct')this.correct++;else if(s==='incorrect')this.incorrect++;else if(s==='skipped')this.skipped++;else this.ungraded++};
SS.prototype.grd=function(){return this.total-this.ungraded};
SS.prototype.pct=function(){var g=this.grd();return g>0?(this.correct/g)*100:0};
SS.prototype.acc=function(){var a=this.grd()-this.skipped;return a>0?(this.correct/a)*100:0};

function AZ(d,st){
    this.d=d;this.st=st;this.subs=[];this.sm=new Map();
    this.correct=0;this.incorrect=0;this.skipped=0;this.ungraded=0;this.reviewed=0;
    var seen=new Set();
    for(var i=0;i<d.length;i++){
        var q=d[i],us=st[i],s=us.st(q.CorrectOptionValue);
        if(s==='correct')this.correct++;else if(s==='incorrect')this.incorrect++;else if(s==='skipped')this.skipped++;else this.ungraded++;
        if(us.review)this.reviewed++;
        if(!seen.has(q.SubjectName)){seen.add(q.SubjectName);this.subs.push(q.SubjectName);this.sm.set(q.SubjectName,new SS(q.SubjectName))}
        this.sm.get(q.SubjectName).add(s);
    }
}
AZ.prototype.tot=function(){return this.d.length};
AZ.prototype.grd=function(){return this.tot()-this.ungraded};
AZ.prototype.att=function(){return this.correct+this.incorrect};
AZ.prototype.pct=function(){var g=this.grd();return g>0?((this.correct/g)*100).toFixed(1):'-'};
AZ.prototype.accu=function(){var a=this.att();return a>0?((this.correct/a)*100).toFixed(1):'-'};
AZ.prototype.grade=function(){
    var g=this.grd();
    if(g===0)return{l:'Ungraded',c:'ung',i:'\u2753',m:'Answer keys are not available for this paper. Your responses have been recorded but cannot be scored.'};
    var p=parseFloat(this.pct());
    if(p>=80)return{l:'Excellent',c:'exc',i:'\u{1F3C6}',m:'Outstanding! Exceptional understanding across all subjects.'};
    if(p>=60)return{l:'Good',c:'gd',i:'\u2B50',m:'Good job! Solid understanding. Review areas where you lost marks.'};
    if(p>=40)return{l:'Average',c:'avg',i:'\u{1F4CA}',m:'Fair performance. Focus on weak areas with more practice.'};
    return{l:'Needs Improvement',c:'pr',i:'\u{1F4DA}',m:'Review all subjects thoroughly and practice more questions.'};
};
AZ.prototype.sub=function(n){return this.sm.get(n)};

function RG(){this._e=new Map();this._d=new Map();this._y=new Map();this._q=new Map();this._c=new Map()}
RG.prototype._k2=function(a,b){return a+'\x00'+b};
RG.prototype._k3=function(a,b,c){return a+'\x00'+b+'\x00'+c};
RG.prototype.ae=function(k,n,i){if(!this._e.has(k))this._e.set(k,{n:n,i:i,ds:new Set()})};
RG.prototype.ad=function(ek,dk,n,i,ds){
    if(!this._e.has(ek))return;
    this._e.get(ek).ds.add(dk);
    var k=this._k2(ek,dk);
    if(!this._d.has(k))this._d.set(k,{id:dk,n:n,i:i,ds:ds});
    if(!this._y.has(k))this._y.set(k,[]);
};
RG.prototype.ay=function(ek,dk,yr,lb,ic,bg){
    var k=this._k2(ek,dk),l=this._y.get(k);if(!l)return;
    for(var i=0;i<l.length;i++)if(l[i].yr===yr)return;
    l.push({yr:yr,lb:lb,ic:ic,bg:bg});
    l.sort(function(a,b){return b.yr-a.yr});
};
RG.prototype.aq=function(ek,dk,yr,cf,qs){var k=this._k3(ek,dk,yr);this._q.set(k,qs);this._c.set(k,cf)};
RG.prototype.exams=function(){var r=[];this._e.forEach(function(v,k){r.push({k:k,n:v.n,i:v.i,c:v.ds.size})});return r};
RG.prototype.depts=function(ek){var r=[],e=this._e.get(ek),s=this;if(!e)return r;e.ds.forEach(function(dk){var d=s._d.get(s._k2(ek,dk));if(d)r.push(d)});return r};
RG.prototype.yrs=function(ek,dk){return this._y.get(this._k2(ek,dk))||[]};
RG.prototype.qs=function(ek,dk,yr){return this._q.get(this._k3(ek,dk,yr))||[]};
RG.prototype.cf=function(ek,dk,yr){return this._c.get(this._k3(ek,dk,yr))||{examTitle:'Mock Test',durationInMinutes:180}};
RG.prototype.en=function(ek){var e=this._e.get(ek);return e?e.n:''};
RG.prototype.dn=function(ek,dk){var d=this._d.get(this._k2(ek,dk));return d?d.n:''};

function TM(s,el,cb){this.rem=s;this.tot=s;this.el=el;this.cb=cb;this.elapsed=0;this._id=null}
TM.prototype.go=function(){this._r();var s=this;this._id=setInterval(function(){s.rem--;s.elapsed++;s._r();if(s.rem<=0){s.stop();if(s.cb)s.cb()}},1000)};
TM.prototype.stop=function(){if(this._id){clearInterval(this._id);this._id=null}};
TM.prototype._r=function(){var h=Math.floor(this.rem/3600),m=String(Math.floor((this.rem%3600)/60)).padStart(2,'0'),s=String(this.rem%60).padStart(2,'0');this.el.textContent=h>0?h+':'+m+':'+s:m+':'+s;this.el.classList.toggle('warn',this.rem<=300)};

function RN(az,cf,nm,el){this.az=az;this.cf=cf;this.nm=nm;this.el=el}
RN.prototype.html=function(){
    var a=this.az,g=a.grade(),t=this.cf.examTitle||'Mock Test',tm=T(this.el);
    var dt=new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
    var h='<div class="ri">';
    h+='<div class="rbn an"><h1>'+H(t)+'</h1><p>'+(this.nm?H(this.nm)+' &bull; ':'')+dt+'</p></div>';
    h+='<div class="scw an d1"><div class="sc"><div class="sv">'+a.correct+'</div><div class="sto">out of '+a.grd()+(a.ungraded?' ('+a.ungraded+' ungraded)':'')+'</div><div class="sp '+g.c+'">'+a.pct()+(a.pct()!=='-'?'%':'')+'</div></div></div>';
    h+='<div class="sg an d2">';
    h+=this._sd('z1','\u2705',a.correct,'Correct');
    h+=this._sd('z2','\u274C',a.incorrect,'Incorrect');
    h+=this._sd('z3','\u23ED\uFE0F',a.skipped,'Skipped');
    h+=this._sd('z4','\u2753',a.ungraded,'Ungraded');
    h+=this._sd('z5','\u{1F3AF}',a.accu()+(a.accu()!=='-'?'%':''),'Accuracy');
    h+=this._sd('z6','\u23F1\uFE0F',tm,'Time Taken');
    h+=this._sd('z7','\u{1F516}',a.reviewed,'Reviewed');
    h+='</div>';
    h+='<div class="rnk an d3"><div class="rkb r-'+g.c+'">'+g.i+' '+g.l+'</div><div class="rkm">'+g.m+'</div></div>';
    h+='<div class="sec an d3">\u{1F4CA} Visual Analysis</div>';
    h+='<div class="chs an d4"><div class="chc">'+this._dn(a)+'</div><div class="chc">'+this._br(a)+'</div></div>';
    h+='<div class="sec an d4">\u{1F4DA} Subject Performance</div>';
    h+='<div class="spg an d5">';
    for(var i=0;i<a.subs.length;i++){
        var sn=a.subs[i],sd=a.sub(sn),pc=sd.pct().toFixed(1),ac=sd.acc().toFixed(1),bc=sd.grd()>0?G(parseFloat(pc)):'ung';
        h+='<div class="spc"><div class="sph"><div class="spn">'+H(sn)+'</div><div class="sps">'+sd.correct+'/'+sd.grd()+(sd.ungraded?' (+'+sd.ungraded+' ungraded)':'')+'</div></div>';
        h+='<div class="bar"><div class="bf '+bc+'" data-tw="'+(sd.grd()>0?pc:'0')+'%" style="width:0%"></div></div>';
        h+='<div class="spr">';
        h+='<div class="spi"><div class="md" style="background:var(--grn)"></div>'+sd.correct+'</div>';
        h+='<div class="spi"><div class="md" style="background:var(--red)"></div>'+sd.incorrect+'</div>';
        h+='<div class="spi"><div class="md" style="background:var(--gry)"></div>'+sd.skipped+' skip</div>';
        if(sd.ungraded)h+='<div class="spi"><div class="md" style="background:var(--pur)"></div>'+sd.ungraded+' N/A</div>';
        h+='<div class="spi"><div class="md" style="background:var(--acc)"></div>Acc: '+(sd.grd()>0?ac+'%':'-')+'</div>';
        h+='</div></div>';
    }
    h+='</div>';
    h+=this._rv(a);
    h+='<div class="ract"><button class="rhm" onclick="E.home()">\u{1F3E0} Home</button><button class="rrd" onclick="E.redo()">\u{1F504} Retake</button></div>';
    h+='</div>';
    return h;
};
RN.prototype._sd=function(c,i,v,l){return'<div class="sd '+c+'"><div class="di">'+i+'</div><div class="dn">'+v+'</div><div class="dl">'+l+'</div></div>'};
RN.prototype._dn=function(a){
    var tot=a.tot(),segs=[{v:a.correct,c:'#22c55e',l:'Correct'},{v:a.incorrect,c:'#ef4444',l:'Incorrect'},{v:a.skipped,c:'#94a3b8',l:'Skipped'},{v:a.ungraded,c:'#8b5cf6',l:'Ungraded'}];
    var r=60,sw=20,cx=80,cy=80,ci=2*Math.PI*r,off=0;
    var svg='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#e2e8f0" stroke-width="'+sw+'"/>';
    for(var i=0;i<segs.length;i++){var p=tot>0?segs[i].v/tot:0,d=p*ci;if(p>0)svg+='<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+segs[i].c+'" stroke-width="'+sw+'" stroke-dasharray="'+d+' '+(ci-d)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 '+cx+' '+cy+')"/>';off+=d}
    var lg='';for(var j=0;j<segs.length;j++)if(segs[j].v>0)lg+='<div class="cli"><div class="cld" style="background:'+segs[j].c+'"></div>'+segs[j].l+': '+segs[j].v+'</div>';
    return'<h3>Distribution</h3><div class="dc"><svg viewBox="0 0 160 160" width="160" height="160">'+svg+'</svg><div class="dcn"><div class="dv">'+a.att()+'</div><div class="dll">Attempted</div></div></div><div class="clg">'+lg+'</div>';
};
RN.prototype._br=function(a){
    var h='<h3>Subject Scores</h3><div style="width:100%">',mx=1;
    for(var i=0;i<a.subs.length;i++){var g=a.sub(a.subs[i]).grd();if(g>mx)mx=g}
    for(var j=0;j<a.subs.length;j++){
        var sn=a.subs[j],sd=a.sub(sn),gt=sd.grd();
        if(gt===0&&sd.ungraded>0){h+='<div style="margin-bottom:10px"><div style="font-size:.72rem;font-weight:600;color:var(--mu);margin-bottom:3px">'+H(sn.length>14?sn.substring(0,14)+'\u2026':sn)+'</div><div style="height:18px;background:#f3e8ff;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;color:#7c3aed">All ungraded</div></div>';continue}
        var wc=gt>0?((sd.correct/mx)*100).toFixed(0):'0',wi=gt>0?((sd.incorrect/mx)*100).toFixed(0):'0',ws=gt>0?((sd.skipped/mx)*100).toFixed(0):'0';
        var short=sn.length>14?sn.substring(0,14)+'\u2026':sn;
        h+='<div style="margin-bottom:10px"><div style="font-size:.72rem;font-weight:600;color:var(--mu);margin-bottom:3px">'+H(short)+'</div>';
        h+='<div style="display:flex;height:18px;background:#e2e8f0;border-radius:4px;overflow:hidden">';
        if(sd.correct>0)h+='<div style="width:'+wc+'%;background:linear-gradient(90deg,#22c55e,#16a34a);color:#fff;font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center" data-tw="'+wc+'%">'+sd.correct+'</div>';
        if(sd.incorrect>0)h+='<div style="width:'+wi+'%;background:linear-gradient(90deg,#ef4444,#dc2626);color:#fff;font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center" data-tw="'+wi+'%">'+sd.incorrect+'</div>';
        if(sd.skipped>0)h+='<div style="width:'+ws+'%;background:linear-gradient(90deg,#94a3b8,#64748b);color:#fff;font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center" data-tw="'+ws+'%">'+sd.skipped+'</div>';
        h+='</div></div>';
    }
    h+='</div><div class="clg"><div class="cli"><div class="cld" style="background:#22c55e"></div>Correct</div><div class="cli"><div class="cld" style="background:#ef4444"></div>Wrong</div><div class="cli"><div class="cld" style="background:#94a3b8"></div>Skip</div></div>';
    return h;
};
RN.prototype._rv=function(a){
    var qd=a.d,us=a.st;
    var h='<div class="sec">\u{1F50D} Question Review</div>';
    h+='<div class="rf" id="rsb"><div class="ft fo" data-sf="ALL" onclick="E.rfs(\'ALL\')">All Subjects</div>';
    for(var i=0;i<a.subs.length;i++){var sn=H(a.subs[i]);h+='<div class="ft" data-sf="'+sn+'" onclick="E.rfs(\''+sn.replace(/'/g,"\\'")+'\')">'+sn+'</div>'}
    h+='</div><div class="rf" id="rfl">';
    h+='<button class="ft fo" data-ft="all" onclick="E.rft(\'all\')">All <span class="fc">'+a.tot()+'</span></button>';
    h+='<button class="ft" data-ft="correct" onclick="E.rft(\'correct\')">\u2705 <span class="fc">'+a.correct+'</span></button>';
    h+='<button class="ft" data-ft="incorrect" onclick="E.rft(\'incorrect\')">\u274C <span class="fc">'+a.incorrect+'</span></button>';
    h+='<button class="ft" data-ft="skipped" onclick="E.rft(\'skipped\')">\u23ED <span class="fc">'+a.skipped+'</span></button>';
    if(a.ungraded>0)h+='<button class="ft" data-ft="ungraded" onclick="E.rft(\'ungraded\')">\u2753 <span class="fc">'+a.ungraded+'</span></button>';
    h+='</div><div id="rqs">';
    for(var i=0;i<qd.length;i++){
        var q=qd[i],st=us[i],s=st.st(q.CorrectOptionValue),sc,sl;
        if(s==='correct'){sc='xc';sl='\u2705 Correct'}else if(s==='incorrect'){sc='xi';sl='\u274C Incorrect'}else if(s==='skipped'){sc='xs';sl='\u23ED Skipped'}else{sc='xu';sl='\u2753 Ungraded'}
        h+='<div class="rq" data-rs="'+s+'" data-ru="'+H(q.SubjectName)+'">';
        h+='<div class="rqh"><div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap"><span class="rqn">Q'+q.QuestionNumber+'</span><span class="rqs">'+H(q.SubjectName)+'</span></div><span class="rqt '+sc+'">'+sl+'</span></div>';
        h+='<div class="rqbd"><div class="rqtx">'+H(q.QuestionText)+'</div>';
        for(var oi=0;oi<q.OptionsValues.length;oi++){
            var o=q.OptionsValues[oi],ic=q.CorrectOptionValue!==null&&o===q.CorrectOptionValue,iu=st.answer===o;
            var oc='on',mk=String.fromCharCode(65+oi);
            if(ic){oc='oc';mk='\u2713'}else if(iu&&q.CorrectOptionValue!==null){oc='ow';mk='\u2717'}else if(iu&&q.CorrectOptionValue===null){oc='ou';mk='\u2022'}
            h+='<div class="ro '+oc+'"><div class="rm">'+mk+'</div><span>'+H(o)+'</span></div>';
        }
        h+='</div><div class="rqsm">';
        if(s==='correct')h+='<span class="gc">\u2705 Correct!</span>';
        else if(s==='incorrect'){h+='<span class="wc">Yours: '+H(st.answer)+'</span>';h+='<span class="gc">Answer: '+H(q.CorrectOptionValue)+'</span>'}
        else if(s==='skipped'){h+='<span style="color:var(--gry)">Not attempted</span>';if(q.CorrectOptionValue!==null)h+='<span class="gc">Answer: '+H(q.CorrectOptionValue)+'</span>';else h+='<span class="uc">Answer key N/A</span>'}
        else{if(st.answer!==null)h+='<span class="uc">Your pick: '+H(st.answer)+'</span>';h+='<span class="uc">Answer key not available</span>'}
        h+='</div></div>';
    }
    h+='</div>';return h;
};

var E={
    rg:new RG(),ek:null,dk:null,yr:null,un:'',
    qd:[],uc:{},us:[],su:[],ci:0,cs:'',tm:null,
    _fs:'all',_fu:'ALL',

    init:function(){this._ld();this._ex()},

    _ld:function(){
        if(typeof examDatabase==='undefined')return;
        for(var i=0;i<examDatabase.length;i++){
            var e=examDatabase[i],ek=e.ExamName;
            this.rg.ae(ek,e.ExamName,e.ExamIcon);
            this.rg.ad(ek,e.DepartmentID,e.DepartmentName,e.DepartmentIcon,e.DepartmentDescription);
            this.rg.ay(ek,e.DepartmentID,e.ExamYear,e.ExamYearLabel||String(e.ExamYear),e.ExamYearIcon||'\u{1F4C5}',e.ExamYearBadge||'');
            this.rg.aq(ek,e.DepartmentID,e.ExamYear,{examTitle:e.ExamConfiguration.ExamTitle,durationInMinutes:e.ExamConfiguration.DurationInMinutes},e.Questions);
        }
    },

    _ex:function(){
        var g=document.getElementById('g1'),ex=this.rg.exams(),s=this;g.innerHTML='';
        ex.forEach(function(x){var c=document.createElement('div');c.className='cc';c.innerHTML='<div class="cci">'+x.i+'</div><div class="cct">'+H(x.n)+'</div><div class="ccs">'+x.c+' Dept(s)</div>';c.onclick=function(){s._pe(x.k,c)};g.appendChild(c)});
    },

    _pe:function(k,el){this.ek=k;this.dk=null;this.yr=null;this._sc('g1',el);document.getElementById('n1').className='sn ok';this._dp(k);this._ss(2);this._bc()},

    _dp:function(ek){
        var g=document.getElementById('g2'),ds=this.rg.depts(ek),s=this;g.innerHTML='';
        ds.forEach(function(d){var c=document.createElement('div');c.className='cc';c.innerHTML='<div class="cci">'+d.i+'</div><div class="cct">'+H(d.n)+'</div><div class="ccs">'+H(d.ds)+'</div>';c.onclick=function(){s._pd(d.id,c)};g.appendChild(c)});
    },

    _pd:function(dk,el){this.dk=dk;this.yr=null;this._sc('g2',el);document.getElementById('n2').className='sn ok';this._yg(this.ek,dk);this._ss(3);this._bc()},

    _yg:function(ek,dk){
        var g=document.getElementById('g3'),ys=this.rg.yrs(ek,dk),s=this;g.innerHTML='';
        ys.forEach(function(y){var c=document.createElement('div');c.className='cc';var inner='<div class="cci">'+y.ic+'</div><div class="cct">'+H(y.lb)+'</div>';if(y.bg)inner+='<div class="ccb'+(y.bg.toLowerCase().indexOf('past')>=0?' past':'')+'">'+H(y.bg)+'</div>';c.innerHTML=inner;c.onclick=function(){s._py(y.yr,c)};g.appendChild(c)});
    },

    _py:function(yr,el){this.yr=yr;this._sc('g3',el);document.getElementById('n3').className='sn ok';this._cf();this._ss(4);this._bc()},

    _cf:function(){
        var cf=this.rg.cf(this.ek,this.dk,this.yr),qs=this.rg.qs(this.ek,this.dk,this.yr);
        var seen=new Set(),ss=[];for(var i=0;i<qs.length;i++)if(!seen.has(qs[i].SubjectName)){seen.add(qs[i].SubjectName);ss.push(qs[i].SubjectName)}
        document.getElementById('ce').textContent=this.rg.en(this.ek);
        document.getElementById('cd').textContent=this.rg.dn(this.ek,this.dk);
        document.getElementById('cy').textContent=String(this.yr);
        document.getElementById('cq').textContent=qs.length;
        document.getElementById('cr').textContent=cf.durationInMinutes+' Minutes';
        document.getElementById('cs').textContent=ss.join(', ');
    },

    _ss:function(n){for(var i=2;i<=4;i++){document.getElementById('s'+i).classList.toggle('gone',i>n);if(i>n)document.getElementById('n'+i).className='sn';else if(i===n)document.getElementById('n'+i).className='sn now'}document.getElementById('s'+n).scrollIntoView({behavior:'smooth',block:'start'})},

    _sc:function(gid,el){var a=document.getElementById(gid).querySelectorAll('.cc');for(var i=0;i<a.length;i++)a[i].classList.remove('sel');el.classList.add('sel')},

    _bc:function(){
        var p=['<span class="bci">'+H(this.rg.en(this.ek))+'</span>'];
        if(this.dk)p.push('<span class="bcs">\u203A</span><span class="bci">'+H(this.rg.dn(this.ek,this.dk))+'</span>');
        if(this.yr)p.push('<span class="bcs">\u203A</span><span class="bci">'+this.yr+'</span>');
        p.push('<span class="bcs">\u203A</span><span class="bca">'+(this.yr?'Confirm':this.dk?'Select Year':'Select Dept')+'</span>');
        document.getElementById('bc').innerHTML=p.join('');
    },

    begin:function(){
        this.un=document.getElementById('iname').value.trim();
        this.uc=this.rg.cf(this.ek,this.dk,this.yr);
        this.qd=this.rg.qs(this.ek,this.dk,this.yr);
        if(!this.qd.length){alert('No questions available.');return}
        this.us=[];for(var i=0;i<this.qd.length;i++)this.us.push(new QS());
        this.su=[];var seen=new Set();
        for(var j=0;j<this.qd.length;j++)if(!seen.has(this.qd[j].SubjectName)){seen.add(this.qd[j].SubjectName);this.su.push(this.qd[j].SubjectName)}
        this.ci=0;this.cs='';
        document.getElementById('v-land').classList.add('gone');
        document.getElementById('v-test').classList.remove('gone');
        document.body.classList.add('locked');
        document.getElementById('tt').textContent=this.uc.examTitle||'Mock Test';
        document.title=this.uc.examTitle||'Mock Test';
        var nm=document.getElementById('tn');if(this.un){nm.textContent=this.un;nm.style.display='inline'}else nm.style.display='none';
        this._tb();this._pl();
        if(this.su.length>0)this._gs(this.su[0]);
        var s=this;this.tm=new TM(this.uc.durationInMinutes*60,document.getElementById('tc'),function(){s.sub(true)});this.tm.go();
    },

    _tb:function(){var c=document.getElementById('ts'),s=this;c.innerHTML='';this.su.forEach(function(sb){var t=document.createElement('div');t.className='stab';t.textContent=sb;t.onclick=function(){s._gs(sb)};c.appendChild(t)})},

    _pl:function(){var g=document.getElementById('tpg'),s=this;g.innerHTML='';for(var i=0;i<this.qd.length;i++){(function(x){var b=document.createElement('div');b.className='pb';b.textContent=s.qd[x].QuestionNumber;b.id='p'+x;b.onclick=function(){s._go(x)};g.appendChild(b)})(i)}},

    _gs:function(sb){
        this.cs=sb;var tabs=document.querySelectorAll('.stab');for(var i=0;i<tabs.length;i++)tabs[i].classList.toggle('on',tabs[i].textContent===sb);
        for(var j=0;j<this.qd.length;j++){var b=document.getElementById('p'+j);if(b)b.style.display=this.qd[j].SubjectName===sb?'flex':'none'}
        var fi=-1;for(var k=0;k<this.qd.length;k++)if(this.qd[k].SubjectName===sb){fi=k;break}
        if(fi>=0)this._go(fi);
    },

    _go:function(x){
        if(x<0||x>=this.qd.length)return;this.ci=x;var q=this.qd[x];
        if(this.cs!==q.SubjectName){this._gs(q.SubjectName);return}
        document.getElementById('tqn').textContent='Question '+q.QuestionNumber;
        document.getElementById('tqb').innerHTML=H(q.QuestionText);
        var oc=document.getElementById('to'),st=this.us[x],s=this;oc.innerHTML='';
        q.OptionsValues.forEach(function(o){
            var lb=document.createElement('label');lb.className='opt'+(st.answer===o?' pk':'');
            var rd=document.createElement('input');rd.type='radio';rd.name='qr';rd.checked=st.answer===o;
            rd.onchange=function(){s._an(o,lb)};
            var sp=document.createElement('span');sp.innerHTML=H(o);
            lb.appendChild(rd);lb.appendChild(sp);oc.appendChild(lb);
        });
        document.getElementById('tsc').scrollTop=0;
        this._up();
        if(window.MathJax&&MathJax.typesetPromise)MathJax.typesetPromise([document.getElementById('tqb'),document.getElementById('to')]).catch(function(){});
    },

    _an:function(v,el){this.us[this.ci].pick(v);var a=document.querySelectorAll('.opt');for(var i=0;i<a.length;i++)a[i].classList.remove('pk');el.classList.add('pk');this._up()},

    clr:function(){this.us[this.ci].clr();var a=document.querySelectorAll('.opt');for(var i=0;i<a.length;i++){a[i].classList.remove('pk');a[i].querySelector('input').checked=false}this._up()},

    nav:function(d){var n=this.ci+d;while(n>=0&&n<this.qd.length){if(this.qd[n].SubjectName===this.cs){this._go(n);return}n+=d}},

    rev:function(){this.us[this.ci].tog();this._up()},

    _up:function(){
        for(var i=0;i<this.qd.length;i++){var b=document.getElementById('p'+i);if(!b)continue;b.className='pb';if(i===this.ci)b.classList.add('c');if(this.us[i].review)b.classList.add('r');else if(this.us[i].has())b.classList.add('a')}
        document.getElementById('trv').innerHTML=this.us[this.ci].review?'\u{1F516} Unmark':'\u{1F516} Review';
    },

    sub:function(auto){
        if(!auto&&!confirm('Submit your exam now?'))return;
        if(this.tm)this.tm.stop();
        var az=new AZ(this.qd,this.us),rn=new RN(az,this.uc,this.un,this.tm?this.tm.elapsed:0);
        document.getElementById('v-test').classList.add('gone');document.body.classList.remove('locked');document.getElementById('v-res').classList.remove('gone');
        document.getElementById('rb').innerHTML=rn.html();
        this._fs='all';this._fu='ALL';
        requestAnimationFrame(function(){setTimeout(function(){var b=document.querySelectorAll('[data-tw]');for(var i=0;i<b.length;i++)b[i].style.width=b[i].getAttribute('data-tw')},120)});
        if(window.MathJax&&MathJax.typesetPromise)MathJax.typesetPromise().catch(function(){});
    },

    rft:function(t){this._fs=t;var b=document.querySelectorAll('#rfl .ft');for(var i=0;i<b.length;i++)b[i].classList.toggle('fo',b[i].getAttribute('data-ft')===t);this._rf()},

    rfs:function(s){this._fu=s;var b=document.querySelectorAll('#rsb .ft');for(var i=0;i<b.length;i++)b[i].classList.toggle('fo',b[i].getAttribute('data-sf')===s);this._rf()},

    _rf:function(){var c=document.querySelectorAll('.rq');for(var i=0;i<c.length;i++){var ms=this._fs==='all'||c[i].getAttribute('data-rs')===this._fs;var mu=this._fu==='ALL'||c[i].getAttribute('data-ru')===this._fu;c[i].style.display=ms&&mu?'':'none'}},

    redo:function(){
        document.getElementById('v-res').classList.add('gone');this.us=[];for(var i=0;i<this.qd.length;i++)this.us.push(new QS());
        this.ci=0;this._fs='all';this._fu='ALL';
        document.getElementById('v-test').classList.remove('gone');document.body.classList.add('locked');
        this._pl();if(this.su.length>0)this._gs(this.su[0]);
        var s=this;this.tm=new TM(this.uc.durationInMinutes*60,document.getElementById('tc'),function(){s.sub(true)});this.tm.go();
    },

    home:function(){
        document.getElementById('v-res').classList.add('gone');document.getElementById('v-test').classList.add('gone');document.body.classList.remove('locked');document.getElementById('v-land').classList.remove('gone');
        for(var i=2;i<=4;i++)document.getElementById('s'+i).classList.add('gone');
        for(var j=1;j<=4;j++)document.getElementById('n'+j).className=j===1?'sn now':'sn';
        var a=document.querySelectorAll('.cc');for(var k=0;k<a.length;k++)a[k].classList.remove('sel');
        this.ek=null;this.dk=null;this.yr=null;this._fs='all';this._fu='ALL';
        document.getElementById('iname').value='';
        document.getElementById('bc').innerHTML='<span class="bca">Select Exam</span>';
        document.title='Mock Test Engine';if(this.tm)this.tm.stop();
    }
};

window.onload=function(){E.init()};
