import numpy as np, wave
SR=44100; BPM=96; BEAT=60/BPM; BAR=4*BEAT; NBARS=12; L=int(round(NBARS*BAR*SR)); TAIL=int(4*SR)
N=L+TAIL
rng=np.random.default_rng(7)
L_=np.zeros(N); R_=np.zeros(N)
def mtof(m): return 440*2**((m-69)/12)
def add(sig,start,pan=0.0,gain=1.0):
    s=int(start*SR); e=min(N,s+len(sig)); sig=sig[:e-s]*gain
    L_[s:e]+=sig*np.cos((pan+1)*np.pi/4); R_[s:e]+=sig*np.sin((pan+1)*np.pi/4)
def env_adsr(n,a,d,s,r,sus_len):
    a=int(a*SR);d=int(d*SR);r=int(r*SR);sl=max(0,int(sus_len*SR)-a-d)
    return np.concatenate([np.linspace(0,1,a,False),np.linspace(1,s,d,False),np.full(sl,s),np.linspace(s,0,r)])[:n] if True else None
def lowpass(x,fc):
    a=np.exp(-2*np.pi*fc/SR); y=np.zeros_like(x); z=0.0
    # vectorised one-pole via lfilter-like loop in chunks
    from scipy.signal import lfilter
    return lfilter([1-a],[1,-a],x)
# chords (MIDI) per 2 bars: Dmaj9, Bm9, Gmaj7(#11), A6sus
chords=[[50,57,61,64,66],[47,54,57,61,62],[43,50,54,57,61],[45,52,57,59,62]]
roots=[38,35,31,33]
# --- pad
for b in range(0,NBARS,2):
    ch=chords[(b//2)%4]; dur=2*BAR
    t=np.arange(int((dur+1.2)*SR))/SR
    sig=np.zeros_like(t)
    for m in ch:
        f=mtof(m+12)
        for det in (-0.12,0.12):
            ff=f*2**(det/12)
            ph=rng.random()*2*np.pi
            sig+= (2*((ff*t+ph/6.28)%1)-1)*0.5
    sig=lowpass(sig,1400)
    e=env_adsr(len(t),0.6,0.4,0.85,1.2,dur)
    add(sig*e/len(ch),b*BAR,pan=0.0,gain=0.10)
# --- kalimba arps (8ths), pattern of chord tones
pat=[0,2,4,3,1,4,2,3]
def kalimba(f,dur=1.4):
    t=np.arange(int(dur*SR))/SR
    s=np.sin(2*np.pi*f*t)*np.exp(-t*4.2)+0.35*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*14)+0.15*np.sin(2*np.pi*f*2*t)*np.exp(-t*7)
    s[:60]*=np.linspace(0,1,60)
    return s
for b in range(NBARS):
    ch=chords[(b//2)%4]
    if b==0: vel=np.linspace(0.4,0.8,8)
    else: vel=np.ones(8)*0.8
    for i in range(8):
        if b==NBARS-1 and i>=6: continue
        m=ch[pat[(i+b)%8]]+24
        tt=b*BAR+i*BEAT/2 + (0.012 if i%2 else 0)
        add(kalimba(mtof(m)),tt,pan=(-0.45 if i%2 else 0.45),gain=0.11*vel[i])
# --- bass (from bar 2), syncopated
bass_pat=[(0,0.75),(1.5,0.4),(2.5,0.4),(3.25,0.5)]
for b in range(1,NBARS):
    r=roots[(b//2)%4]
    for pos,d in bass_pat:
        t=np.arange(int((d+0.2)*SR))/SR; f=mtof(r)
        s=np.sin(2*np.pi*f*t)+0.25*np.sin(4*np.pi*f*t)
        e=np.minimum(1,t/0.01)*np.exp(-t*2.2); e[int(d*SR):]*=np.linspace(1,0,len(e)-int(d*SR))
        add(s*e,b*BAR+pos*BEAT,gain=0.22)
# --- drums (bar 2..11, bar 12 breaks down for the loop)
def kick():
    t=np.arange(int(0.35*SR))/SR; f=50+90*np.exp(-t*30); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*9)
def shaker(dur=0.07):
    n=rng.standard_normal(int(dur*SR)); from scipy.signal import lfilter
    n=lfilter([1,-1],[1,-0.6],n); t=np.arange(len(n))/SR; return n*np.exp(-t*60)
def rim():
    t=np.arange(int(0.08*SR))/SR; return (np.sin(2*np.pi*1700*t)+0.5*np.sin(2*np.pi*820*t))*np.exp(-t*70)
def logdrum(f):
    t=np.arange(int(0.5*SR))/SR; ff=f*(1+0.6*np.exp(-t*40)); return np.tanh(2*np.sin(2*np.pi*np.cumsum(ff)/SR))*np.exp(-t*6)
for b in range(1,NBARS):
    last=(b==NBARS-1)
    for beat in (0,2) if not last else (0,):
        add(kick(),b*BAR+beat*BEAT,gain=0.42)
    if not last:
        add(kick(),b*BAR+2.75*BEAT,gain=0.22)
    for s16 in range(16 if not last else 8):
        acc=0.55 if s16%4==2 else 0.3
        add(shaker(),b*BAR+s16*BEAT/4+(0.01 if s16%2 else 0),pan=0.3,gain=0.06*acc*2)
    for beat in (1,3):
        if not last: add(rim(),b*BAR+beat*BEAT+BEAT*0.5,pan=-0.25,gain=0.06)
    if b>=3 and not last and b%2==1:
        r=roots[(b//2)%4]
        add(logdrum(mtof(r+12)),b*BAR+3.5*BEAT,gain=0.10)
# --- sparkle chime on each bar downbeat (scene changes)
def chime(f):
    t=np.arange(int(2.0*SR))/SR
    return sum(a*np.sin(2*np.pi*f*k*t)*np.exp(-t*(2.5+k)) for k,a in ((1,1),(2.76,0.4),(5.4,0.2)))
for b in range(1,NBARS):
    add(chime(mtof(81 if b%2 else 86)),b*BAR-0.02,pan=(0.5 if b%2 else -0.5),gain=0.035)
# soft swell/whoosh before each bar
for b in range(1,NBARS):
    d=0.45; n=rng.standard_normal(int(d*SR)); from scipy.signal import lfilter
    n=lfilter([0.05],[1,-0.95],n); e=np.linspace(0,1,len(n))**2
    add(n*e,b*BAR-d,gain=0.05)
# --- reverb (stereo), FFT convolution with decaying noise
def rev(x,seed):
    r=np.random.default_rng(seed); n=int(2.4*SR); t=np.arange(n)/SR
    ir=r.standard_normal(n)*np.exp(-t*2.6); ir=lowpass(ir,5000); ir/=np.sqrt((ir**2).sum())
    M=len(x)+n; F=1<<int(np.ceil(np.log2(M)))
    return np.fft.irfft(np.fft.rfft(x,F)*np.fft.rfft(ir,F),F)[:len(x)]
wetL=rev(L_,1); wetR=rev(R_,2)
outL=L_+0.28*wetL; outR=R_+0.28*wetR
# wrap tail for seamless loop
lp=np.zeros((L,2)); lp[:,0]=outL[:L]; lp[:,1]=outR[:L]
lp[:TAIL,0]+=outL[L:L+TAIL]; lp[:TAIL,1]+=outR[L:L+TAIL]
lp/=np.max(np.abs(lp))*1.12
lp=np.tanh(lp*1.1)/np.tanh(1.1)*0.89
def write(path,data,sr):
    d=(np.clip(data,-1,1)*32767).astype('<i2')
    with wave.open(path,'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(d.tobytes())
write('music44.wav',lp,SR)
print('len',L/SR)
