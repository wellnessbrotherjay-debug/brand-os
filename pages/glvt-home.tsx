
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Menu, X, Upload, Minus, Plus, Edit3, Instagram, Twitter, MessageCircle, ArrowUpRight, Monitor, Smartphone, Activity, MapPin, Wind, Zap, Droplets, Snowflake } from 'lucide-react';
import { Reveal } from '../components/glvt/Reveal';

// --- Contexts ---
interface EditContextType {
  isEditing: boolean;
}
const EditContext = createContext<EditContextType>({ isEditing: false });

type PageType = 'home' | 'club' | 'partner' | 'technology' | 'classes' | 'membership' | 'contact' | 'member';

interface NavContextType {
  currentPage: PageType;
  navigateTo: (page: PageType) => void;
}
const NavContext = createContext<NavContextType>({ currentPage: 'home', navigateTo: () => { } });

// --- Components ---

const Logo: React.FC<{ className?: string; color?: string }> = ({ className = "h-8 md:h-12", color = "currentColor" }) => (
  <div className={`font-serif flex items-center transition-colors duration-500 ${className}`} style={{ color }}>
    <span className="text-inherit tracking-[0.25em] font-medium uppercase">GLVT</span>
  </div>
);

const EditableLink: React.FC<{
  href: string;
  className?: string;
  children: React.ReactNode;
}> = ({ href: initialHref, className, children }) => {
  const { isEditing } = useContext(EditContext);
  const [href, setHref] = useState(initialHref);

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) {
      e.preventDefault();
      const newUrl = prompt("Enter URL for this link:", href);
      if (newUrl !== null) {
        setHref(newUrl);
      }
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`${className} ${isEditing ? 'cursor-alias ring-1 ring-blue-500 rounded px-1' : ''}`}
    >
      {children}
    </a>
  );
};

const EditableImage: React.FC<{
  defaultSrc: string;
  alt: string;
  className?: string;
  parallaxSpeed?: number;
  isBackground?: boolean;
}> = ({ defaultSrc, alt, className = "", parallaxSpeed = 0, isBackground = false }) => {
  const { isEditing } = useContext(EditContext);
  const [src, setSrc] = useState(defaultSrc);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scale, setScale] = useState(parallaxSpeed ? 1.2 : 1.0);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef({ x: 0, y: 0 });

  const [offset, setOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parallaxSpeed === 0 || window.innerWidth < 768) return;
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      if (scrollProgress >= 0 && scrollProgress <= 1) {
        setOffset((scrollProgress - 0.5) * parallaxSpeed * 20);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallaxSpeed]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { ...position };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const sensitivity = 0.15 / scale;

      setPosition({
        x: Math.max(0, Math.min(100, startPosRef.current.x - dx * sensitivity)),
        y: Math.max(0, Math.min(100, startPosRef.current.y - dy * sensitivity))
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, scale]);

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSrc(url);
    }
  };

  const adjustScale = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.max(1.0, Math.min(3.0, prev + delta)));
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className} ${isEditing ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      onMouseDown={handleMouseDown}
      style={{ cursor: isEditing ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {isEditing && (
        <div className="absolute top-2 right-2 z-50 flex flex-col gap-2">
          <button onClick={handleUploadClick} className="bg-glvt-stone text-white p-2 rounded-full shadow-lg hover:bg-black transition-colors"><Upload size={16} /></button>
          <div className="bg-white/90 backdrop-blur text-black rounded-full shadow-lg flex flex-col items-center overflow-hidden">
            <button onClick={(e) => adjustScale(0.1, e)} className="p-2 hover:bg-gray-200 border-b border-gray-200"><Plus size={16} /></button>
            <button onClick={(e) => adjustScale(-0.1, e)} className="p-2 hover:bg-gray-200"><Minus size={16} /></button>
          </div>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-transform duration-75 ease-out ${isBackground ? 'absolute inset-0' : ''}`}
        style={{
          objectPosition: `${position.x}% ${position.y}%`,
          transform: `translateY(${offset}px) scale(${scale})`
        }}
        draggable={false}
      />
    </div>
  );
};

const EditableText: React.FC<{
  defaultText: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  onClick?: () => void;
}> = ({ defaultText, className = "", tag: Tag = 'div', onClick }) => {
  const { isEditing } = useContext(EditContext);
  const [text, setText] = useState(defaultText);
  const [fontSize, setFontSize] = useState<number>(100);

  const scaleStyle = { fontSize: `${fontSize}%` };

  const handleIncrease = (e: React.MouseEvent) => { e.stopPropagation(); setFontSize(p => p + 10); };
  const handleDecrease = (e: React.MouseEvent) => { e.stopPropagation(); setFontSize(p => Math.max(10, p - 10)); };

  if (isEditing) {
    return (
      <div className="relative inline-block group border border-dashed border-transparent hover:border-glvt-stone rounded p-1 -m-1 transition-all">
        <div className="absolute -top-8 left-0 hidden group-hover:flex bg-white shadow-lg rounded-md overflow-hidden border border-gray-200 z-50">
          <button onClick={handleDecrease} className="p-1 hover:bg-gray-100 text-black"><Minus size={12} /></button>
          <span className="text-[10px] p-1 font-mono text-black">{fontSize}%</span>
          <button onClick={handleIncrease} className="p-1 hover:bg-gray-100 text-black"><Plus size={12} /></button>
        </div>
        <Tag
          className={`outline-none focus:bg-glvt-stone/10 ${className}`}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e: React.FormEvent<HTMLElement>) => setText(e.currentTarget.innerText)}
          style={scaleStyle}
          onClick={onClick}
        >
          {text}
        </Tag>
      </div>
    );
  }

  return <Tag className={className} style={scaleStyle} onClick={onClick}>{text}</Tag>;
};

const VideoIntro: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
  }, []);

  const handleEnter = () => {
    setVisible(false);
    setTimeout(onComplete, 1200);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-glvt-black flex items-center justify-center transition-opacity duration-1000 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-70 grayscale-[20%] brightness-[70%]"
        muted
        playsInline
        loop
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-woman-doing-exercises-on-the-simulator-in-the-gym-41315-large.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <div className="animate-fade-in-up">
          <Logo className="h-20 md:h-32 mb-10" color="white" />
          <p className="font-sans text-[11px] md:text-sm tracking-[0.5em] text-white/90 uppercase mb-20 font-light">The Ritual Begins</p>
        </div>

        <button
          onClick={handleEnter}
          className="group cursor-pointer py-4 px-16 transition-all duration-700 relative overflow-hidden"
        >
          <span className="font-sans text-[11px] md:text-sm text-white tracking-[0.6em] uppercase border-b border-white/20 group-hover:border-white pb-4 transition-all relative z-10">
            Enter
          </span>
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
        </button>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// --- Navigation ---

const Navigation: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentPage, navigateTo } = useContext(NavContext);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { label: string; value: PageType }[] = [
    { label: 'Home', value: 'home' },
    { label: 'Facilities', value: 'club' },
    { label: 'Partner Facilities', value: 'partner' },
    { label: 'Bio-Circuit', value: 'technology' },
    { label: 'Training', value: 'classes' },
    { label: 'Membership', value: 'membership' },
    { label: 'Member Portal', value: 'member' },
  ];

  const isLogoBlack = isMenuOpen || isScrolled || (currentPage !== 'home' && currentPage !== 'club');
  const logoColor = isLogoBlack ? '#0F0F0F' : '#FFFFFF';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-700 ease-in-out border-b ${isScrolled
          ? 'bg-glvt-sand/95 backdrop-blur-md pt-4 pb-4 border-glvt-black/5'
          : (currentPage === 'home' || currentPage === 'club') ? 'bg-transparent pt-10 pb-6 border-transparent' : 'bg-glvt-sand pt-6 pb-6 border-glvt-black/5'
          }`}
      >
        <div className="container mx-auto px-6 md:px-12 flex justify-between items-center max-w-[1600px]">
          <div onClick={() => navigateTo('home')} className="cursor-pointer z-50">
            <Logo
              className="h-6 md:h-9"
              color={logoColor}
            />
          </div>

          <div className="hidden lg:flex items-center gap-12">
            {navItems.filter(item => item.value !== 'member').map((item) => (
              <button
                key={item.value}
                onClick={() => navigateTo(item.value)}
                className={`text-[9px] font-sans font-medium tracking-super-wide uppercase hover:text-glvt-stone transition-colors duration-300 
                  ${currentPage === item.value ? 'text-glvt-stone' : (isLogoBlack ? 'text-glvt-black' : 'text-white')}`}
              >
                <EditableText defaultText={item.label} tag="span" />
              </button>
            ))}
            <button
              onClick={() => navigateTo('contact')}
              className={`ml-6 px-6 py-2 border text-[9px] font-sans font-medium tracking-super-wide uppercase transition-all duration-500 hover:bg-glvt-stone hover:border-glvt-stone hover:text-white ${isLogoBlack ? 'border-glvt-black text-glvt-black' : 'border-white text-white'}`}
            >
              <EditableText defaultText="Inquire" tag="span" />
            </button>
            <button
              onClick={() => navigateTo('member')}
              className={`ml-2 px-6 py-2 bg-glvt-stone text-white text-[9px] font-sans font-medium tracking-super-wide uppercase transition-all duration-500 hover:bg-glvt-black`}
            >
              <EditableText defaultText="Member Login" tag="span" />
            </button>
          </div>

          <button className="lg:hidden z-50 p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? (
              <X className="w-6 h-6 text-glvt-black" />
            ) : (
              <Menu className={`w-6 h-6 ${isLogoBlack ? 'text-glvt-black' : 'text-white'}`} />
            )}
          </button>
        </div>
      </nav>

      <div className={`fixed inset-0 bg-glvt-sand z-40 flex items-center justify-center transition-all duration-1000 cubic-bezier(0.7, 0, 0.3, 1) ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center justify-center w-full max-w-sm px-10">
          {navItems.map((item, idx) => (
            <button
              key={item.value}
              onClick={() => { navigateTo(item.value); setIsMenuOpen(false); }}
              className={`w-full group py-4 transition-all duration-700 ease-out border-b border-glvt-black/5 last:border-0 ${isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
              style={{ transitionDelay: `${idx * 0.08}s` }}
            >
              <span className="block text-lg md:text-xl font-serif text-glvt-black tracking-[0.25em] uppercase group-hover:text-glvt-stone transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

const HeroSection: React.FC = () => {
  return (
    <section className="relative h-screen w-full flex items-center justify-center bg-glvt-black overflow-hidden">
      <EditableImage
        defaultSrc="https://ibb.co.com/9m96Tj3s"
        alt="Hero Background"
        className="absolute inset-0 w-full h-full opacity-40"
        isBackground={true}
        parallaxSpeed={3}
      />

      <div className="relative z-10 text-center px-6 max-w-6xl">
        <Reveal direction="up" delay={0.3}>
          <h1 className="text-white font-serif text-6xl md:text-9xl lg:text-[12rem] leading-[0.9] tracking-tight">
            <EditableText defaultText="WHERE THE BODY" tag="div" className="mb-8" />
            <span className="italic font-light opacity-60 block"><EditableText defaultText="IS HONORED" tag="span" /></span>
          </h1>
        </Reveal>
      </div>
    </section>
  );
};

const IntroSection: React.FC = () => {
  return (
    <section className="bg-glvt-sand pt-40 pb-40 px-6 md:px-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 md:gap-32 items-start">
        <div className="md:sticky md:top-32">
          <Reveal>
            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl text-glvt-black leading-[1.1] mb-20">
              <EditableText defaultText="The woman does not come to become someone else." tag="span" />
            </h2>

            <div className="hidden md:block w-full h-[550px] relative overflow-hidden">
              <EditableImage
                defaultSrc="https://images.unsplash.com/photo-1550345332-09e3ac987658?q=80&w=2787&auto=format&fit=crop"
                alt="Philosophy Visual"
                className="grayscale hover:grayscale-0 transition-all duration-[1.5s] object-cover"
              />
            </div>
          </Reveal>
        </div>

        <div className="pt-6 md:pt-32">
          <Reveal delay={0.3}>
            <div className="space-y-16">
              <div className="w-16 h-[1px] bg-glvt-stone/30"></div>
              <p className="italic font-serif text-2xl md:text-3xl text-glvt-charcoal/70 leading-[1.6]">
                <EditableText defaultText="“The body is not a problem to fix. It is a place to live.”" tag="span" />
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const ClubSection: React.FC = () => {
  return (
    <div className="bg-glvt-black text-glvt-cream">
      {/* Immersive Intro */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <EditableImage
          defaultSrc="https://images.unsplash.com/photo-1519664824562-b4bc73f9713c?q=80&w=2760&auto=format&fit=crop"
          alt="Club Architecture"
          className="absolute inset-0 w-full h-full opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000"
          isBackground={true}
          parallaxSpeed={3}
        />
        <div className="relative z-10 text-center px-6 max-w-5xl">
          <Reveal direction="up">
            <EditableText defaultText="FACILITIES" tag="div" className="font-sans text-[10px] tracking-[0.8em] uppercase text-glvt-stone mb-10" />
            <h1 className="font-serif text-5xl md:text-[10rem] leading-none tracking-tighter mb-12">
              <EditableText defaultText="THE CLUB" tag="div" />
            </h1>
            <p className="font-sans text-sm md:text-lg font-light tracking-wide max-w-2xl mx-auto opacity-60 leading-relaxed">
              <EditableText defaultText="An architectural synthesis of raw strength and refined elegance. Designed for the woman who demands excellence from her environment." tag="span" />
            </p>
          </Reveal>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
          <div className="w-[1px] h-20 bg-white"></div>
        </div>
      </section>

      {/* Facility Grid - Editorial Inspired */}
      <section className="py-40 px-6 md:px-12 bg-[#0A0A0A]">
        <div className="container mx-auto max-w-[1600px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-4">
            {/* Item 1: The Main Floor */}
            <div className="lg:col-span-2 group relative h-[70vh] overflow-hidden bg-glvt-charcoal cursor-pointer">
              <EditableImage
                defaultSrc="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2940&auto=format&fit=crop"
                alt="Main Performance Floor"
                className="opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-102 transition-all duration-[2s]"
                isBackground={true}
              />
              <div className="absolute bottom-10 left-10 z-10">
                <Reveal delay={0.2}>
                  <h3 className="font-serif text-4xl text-white tracking-widest uppercase opacity-80">
                    <EditableText defaultText="THE MAIN FLOOR" tag="span" />
                  </h3>
                </Reveal>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            </div>

            {/* Item 2: Private Studio */}
            <div className="group relative h-[70vh] overflow-hidden bg-glvt-charcoal cursor-pointer">
              <EditableImage
                defaultSrc="https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2940&auto=format&fit=crop"
                alt="Private Studio"
                className="opacity-40 group-hover:scale-102 transition-all duration-[2s]"
                isBackground={true}
              />
              <div className="absolute bottom-10 left-10 z-10">
                <Reveal delay={0.3}>
                  <h3 className="font-serif text-3xl text-white tracking-widest uppercase opacity-80">
                    <EditableText defaultText="REFORMER SUITE" tag="span" />
                  </h3>
                </Reveal>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            </div>

            {/* Item 3: Luxury Recovery */}
            <div className="group relative h-[70vh] overflow-hidden bg-glvt-charcoal cursor-pointer">
              <EditableImage
                defaultSrc="https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=2940&auto=format&fit=crop"
                alt="Steam & Recovery"
                className="opacity-40 group-hover:scale-102 transition-all duration-[2s]"
                isBackground={true}
              />
              <div className="absolute bottom-10 left-10 z-10">
                <Reveal delay={0.4}>
                  <h3 className="font-serif text-3xl text-white tracking-widest uppercase opacity-80">
                    <EditableText defaultText="STEAM & SAUNA" tag="span" />
                  </h3>
                </Reveal>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            </div>

            {/* Item 4: Locker Room */}
            <div className="lg:col-span-2 group relative h-[70vh] overflow-hidden bg-glvt-charcoal cursor-pointer">
              <EditableImage
                defaultSrc="https://images.unsplash.com/photo-1590402494610-2c378a9114c6?q=80&w=2940&auto=format&fit=crop"
                alt="Vanity & Spa"
                className="opacity-40 grayscale group-hover:grayscale-0 group-hover:scale-102 transition-all duration-[2s]"
                isBackground={true}
              />
              <div className="absolute bottom-10 left-10 z-10">
                <Reveal delay={0.5}>
                  <h3 className="font-serif text-4xl text-white tracking-widest uppercase opacity-80">
                    <EditableText defaultText="VANITY LOUNGE" tag="span" />
                  </h3>
                </Reveal>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-40 bg-glvt-black overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
            <div className="relative">
              <Reveal direction="right">
                <div className="relative z-10">
                  <EditableImage
                    defaultSrc="https://images.unsplash.com/photo-1621334698544-783424ba7b10?q=80&w=2836&auto=format&fit=crop"
                    alt="Detail facility"
                    className="h-[80vh] w-full object-cover"
                  />
                </div>
                {/* Floating architectural element */}
                <div className="absolute -bottom-10 -right-10 w-64 h-80 bg-glvt-charcoal z-0 hidden lg:block border border-white/10 p-6 flex items-end">
                  <p className="font-sans text-[8px] tracking-[0.4em] text-white/30 uppercase leading-loose">
                    PRECISION<br />EQUIPMENT<br />BIOMETRIC<br />INTEGRATION
                  </p>
                </div>
              </Reveal>
            </div>

            <div className="space-y-16">
              <Reveal direction="left">
                <h2 className="font-serif text-4xl md:text-6xl text-white leading-tight">
                  <EditableText defaultText="Curated for the" tag="div" />
                  <span className="italic opacity-60"><EditableText defaultText="Extraordinary" tag="span" /></span>
                </h2>

                <div className="space-y-12 pt-10 border-t border-white/10">
                  {[
                    { icon: <Droplets size={24} />, title: "Filtered Water", desc: "Alkaline and chilled water stations throughout the club." },
                    { icon: <Wind size={24} />, title: "Air Purification", desc: "HEPA-standard medical grade air filtration for optimal breathing." },
                    { icon: <Snowflake size={24} />, title: "Ice Plunge", desc: "The ultimate metabolic reset after a high-intensity ritual." },
                    { icon: <Zap size={24} />, title: "Bio-Station", desc: "Integrated biometric tracking at every specialized weight station." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-8 group">
                      <div className="text-glvt-stone group-hover:text-white transition-colors duration-500 pt-1">{item.icon}</div>
                      <div>
                        <h4 className="font-sans text-xs tracking-widest font-bold uppercase text-white mb-2">{item.title}</h4>
                        <p className="font-sans text-xs text-white/50 leading-relaxed font-light">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Large Statement Image */}
      <section className="h-[90vh] w-full relative overflow-hidden flex items-center justify-center">
        <EditableImage
          defaultSrc="https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?q=80&w=2940&auto=format&fit=crop"
          alt="Interior Statement"
          isBackground={true}
          parallaxSpeed={2}
          className="brightness-[0.4] grayscale"
        />
        <div className="relative z-10 text-center">
          <Reveal>
            <h2 className="text-white/20 font-serif text-[6rem] md:text-[18rem] tracking-tighter leading-none italic select-none">Sanctuary</h2>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

const TechnologySection: React.FC = () => {
  return (
    <section className="bg-glvt-black text-glvt-cream py-24 border-t border-white/5 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <Reveal>
          <EditableText defaultText="INTELLIGENT MOVEMENT" tag="div" className="font-sans text-[10px] tracking-super-wide uppercase text-glvt-stone mb-6" />
          <h2 className="font-serif text-4xl md:text-6xl mb-12">
            <EditableText defaultText="THE BIO-CIRCUIT" tag="span" />
          </h2>
          <EditableText
            defaultText="A visually immersive experience. Map your progress through advanced biometrics and integrated guidance."
            tag="p"
            className="font-sans text-sm font-light text-white/50 mb-16 max-w-2xl leading-relaxed"
          />
        </Reveal>

        <div className="space-y-12">
          <Reveal width="100%">
            <div className="relative w-full aspect-[21/9] bg-glvt-charcoal rounded-sm overflow-hidden border border-white/5 shadow-3xl group">
              <EditableImage
                defaultSrc="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2940&auto=format&fit=crop"
                alt="Visual Guidance Screen"
                isBackground={true}
                className="opacity-40 group-hover:opacity-60 transition-opacity duration-[1.5s]"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Monitor size={48} className="text-white mx-auto mb-4 opacity-60" />
                  <EditableText defaultText="VISUAL GUIDANCE" tag="h3" className="font-serif text-3xl md:text-5xl text-white tracking-widest" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const ClassesSection: React.FC = () => {
  return (
    <section className="bg-glvt-sand pt-40 pb-40 px-6 md:px-12">
      <div className="container mx-auto max-w-[1600px]">
        <Reveal>
          <div className="mb-20">
            <EditableText defaultText="THE TRAINING" tag="h2" className="font-serif text-5xl md:text-7xl text-glvt-black mb-6 leading-none" />
            <div className="max-w-xl">
              <EditableText
                defaultText="Movement redefined as art. Our specialized training zones are designed to maximize both aesthetic results and physical longevity."
                tag="p"
                className="font-sans text-xs md:text-sm font-light text-glvt-charcoal/70 tracking-wide leading-relaxed"
              />
            </div>
          </div>
        </Reveal>

        <div className="space-y-32">
          {/* Group Classes Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal width="100%">
              <div className="relative h-[70vh] overflow-hidden group rounded-sm">
                <EditableImage
                  defaultSrc="https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=2787&auto=format&fit=crop"
                  alt="Group Training"
                  isBackground={true}
                  className="grayscale-[50%] hover:grayscale-0 transition-all duration-1000"
                />
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="space-y-8 max-w-lg">
                <EditableText defaultText="THE RITUAL" tag="h3" className="font-serif text-4xl md:text-6xl text-glvt-black" />
                <EditableText defaultText="GROUP CLASSES" tag="span" className="font-sans text-[10px] tracking-super-wide uppercase text-glvt-stone block border-b border-glvt-stone/20 pb-2" />
                <EditableText
                  defaultText="Collective energy meet specialized focus. Our small group rituals ensure personalized attention while fostering a community of powerful women."
                  tag="p"
                  className="font-sans text-sm md:text-base font-light text-glvt-charcoal/80 leading-loose"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

const MembershipSection: React.FC = () => {
  return (
    <section id="membership" className="bg-glvt-linen py-40 border-t border-glvt-stone/10">
      <div className="container mx-auto px-6 text-center">
        <Reveal>
          <h2 className="font-serif text-5xl md:text-7xl text-glvt-black mb-20">
            <EditableText defaultText="MEMBERSHIP" tag="span" />
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { name: "Drop In", sub: "Single Session" },
            { name: "5 Pack", sub: "Class Package" },
            { name: "10 Pack", sub: "Class Package" }
          ].map((tier, i) => (
            <div key={i} className="py-12 px-8 border border-glvt-stone/20 hover:border-glvt-black transition-all duration-1000 hover:bg-white/30 backdrop-blur-sm group rounded-sm">
              <span className="font-sans text-[10px] tracking-super-wide uppercase text-glvt-stone mb-4 block group-hover:text-glvt-black transition-colors">
                <EditableText defaultText={tier.sub} tag="span" />
              </span>
              <h3 className="font-serif text-3xl text-glvt-black">
                <EditableText defaultText={tier.name} tag="span" />
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ContactSection: React.FC = () => {
  return (
    <section className="bg-glvt-sand py-24 flex flex-col items-center justify-center">
      <div className="text-center space-y-10 px-6 max-w-3xl">
        <h2 className="font-serif text-4xl md:text-6xl text-glvt-black">
          <EditableText defaultText="Begin Your Ritual" tag="span" />
        </h2>
        <p className="font-sans text-sm md:text-base font-light text-glvt-charcoal/70 leading-relaxed">
          <EditableText defaultText="We invite you to experience the club. Contact us directly for a personal orientation." tag="span" />
        </p>

        <div className="pt-8">
          <button
            onClick={() => window.open('https://wa.me/8618616700279', '_blank')}
            className="inline-flex items-center gap-4 bg-glvt-black text-white px-10 py-4 font-sans text-[10px] font-bold tracking-super-wide uppercase hover:bg-glvt-charcoal transition-all shadow-xl"
          >
            <MessageCircle size={16} />
            <span>WhatsApp Inquire</span>
          </button>
        </div>
      </div>
    </section>
  )
}

const Footer: React.FC = () => {
  return (
    <footer className="bg-glvt-black text-white pt-24 pb-12">
      <div className="container mx-auto px-6 text-center">
        <div className="mb-16">
          <Logo className="h-10 md:h-14 mx-auto mb-6" color="#FFFFFF" />
          <EditableText
            defaultText="Where the body is honored"
            tag="p"
            className="font-sans text-[10px] tracking-[0.4em] uppercase mt-4 opacity-60 font-light text-white"
          />
        </div>

        {/* Contact Information */}
        <div className="mb-12">
          <div className="flex justify-center items-center gap-8">
            {/* Instagram */}
            <EditableLink
              href="https://instagram.com/glvt_bali"
              className="text-white opacity-90 hover:opacity-100 transition-all group"
            >
              <Instagram size={24} className="group-hover:scale-110 transition-transform" />
            </EditableLink>

            {/* Phone/WhatsApp */}
            <EditableLink
              href="https://wa.me/8618616700279"
              className="text-white opacity-90 hover:opacity-100 transition-all group"
            >
              <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
            </EditableLink>

            {/* Location */}
            <EditableLink
              href="https://maps.google.com/?q=Bali,Indonesia"
              className="text-white opacity-90 hover:opacity-100 transition-all group"
            >
              <MapPin size={24} className="group-hover:scale-110 transition-transform" />
            </EditableLink>
          </div>
        </div>

        <div className="font-sans text-[9px] tracking-widest uppercase opacity-40 text-white">
          <EditableText defaultText="© 2025 GLVT. PRIVACY & TERMS." tag="span" />
        </div>
      </div>
    </footer>
  );
};

const MemberLoginSection: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'test' && password === '123456') {
      // Redirect to GLVT app after login
      window.location.href = 'https://exequte-hotel-1.vercel.app';
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <section className="bg-glvt-black min-h-screen flex items-center justify-center py-40 px-6">
      <div className="max-w-md w-full">
        <Reveal>
          <div className="text-center mb-12">
            <Logo className="h-16 md:h-20 mx-auto mb-8" color="#FFFFFF" />
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">
              <EditableText defaultText="Member Login" tag="span" />
            </h2>
            <p className="font-sans text-xs text-white/60 tracking-wider uppercase">
              <EditableText defaultText="Access Your Training Portal" tag="span" />
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-sans uppercase tracking-wide">
                {error}
              </div>
            )}
            <div>
              <label className="block font-sans text-[10px] tracking-widest uppercase text-white/80 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white font-sans text-sm focus:outline-none focus:border-glvt-stone transition-colors"
                placeholder="Username"
              />
            </div>

            <div>
              <label className="block font-sans text-[10px] tracking-widest uppercase text-white/80 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white font-sans text-sm focus:outline-none focus:border-glvt-stone transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-glvt-stone text-white py-4 font-sans text-[10px] font-bold tracking-super-wide uppercase hover:bg-white hover:text-glvt-black transition-all duration-500 mt-8"
            >
              Enter Portal
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="font-sans text-[10px] text-white/40 tracking-wider">
              Not a member yet?{' '}
              <EditableLink
                href="https://wa.me/8618616700279"
                className="text-glvt-stone hover:text-white transition-colors underline"
              >
                Contact us
              </EditableLink>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const PartnerSection: React.FC = () => {
  return (
    <section className="bg-glvt-sand pt-40 pb-40 min-h-screen">
      <div className="container mx-auto px-6 mb-16">
        <Reveal>
          <EditableText defaultText="EXCLUSIVE PRIVILEGE" tag="div" className="font-sans text-[10px] tracking-super-wide uppercase text-glvt-stone mb-4" />
          <h2 className="font-serif text-4xl md:text-6xl text-glvt-black mb-8">
            <EditableText defaultText="THE #1 WELLNESS CLUB" tag="span" />
          </h2>
        </Reveal>
      </div>

      <div className="space-y-10 px-4 md:px-12">
        <Reveal width="100%">
          <div className="relative h-[60vh] w-full group overflow-hidden bg-glvt-black flex items-center justify-center">
            <EditableImage
              defaultSrc="https://images.unsplash.com/photo-1572331165267-854da2b00ca1?q=80&w=2940&auto=format&fit=crop"
              alt="The Pools"
              isBackground={true}
              className="opacity-70 group-hover:scale-110 transition-transform duration-[2s] ease-out grayscale group-hover:grayscale-0"
            />
            <div className="relative z-10 w-full text-center mix-blend-overlay">
              <h3 className="text-6xl md:text-[10rem] font-bold font-sans text-transparent text-outline tracking-tighter leading-none opacity-80">
                <EditableText defaultText="POOLS" tag="span" />
              </h3>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const App: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [showIntro, setShowIntro] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const navigateTo = (page: PageType) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <EditContext.Provider value={{ isEditing }}>
      <NavContext.Provider value={{ currentPage, navigateTo }}>
        <div className="bg-glvt-sand min-h-screen flex flex-col" ref={scrollRef}>

          {showIntro && <VideoIntro onComplete={() => setShowIntro(false)} />}

          <Navigation />
          <main className="flex-grow">
            {currentPage === 'home' && (
              <>
                <HeroSection />
                <IntroSection />
              </>
            )}
            {currentPage === 'club' && <ClubSection />}
            {currentPage === 'partner' && <PartnerSection />}
            {currentPage === 'technology' && <TechnologySection />}
            {currentPage === 'classes' && <ClassesSection />}
            {currentPage === 'membership' && <MembershipSection />}
            {currentPage === 'contact' && <ContactSection />}
            {currentPage === 'member' && <MemberLoginSection />}
          </main>
          <Footer />

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`fixed bottom-10 right-10 z-[100] flex items-center justify-center w-14 h-14 rounded-full shadow-3xl transition-all duration-300 ${isEditing ? 'bg-glvt-stone text-white' : 'bg-glvt-black text-white hover:bg-glvt-charcoal'}`}
          >
            {isEditing ? <X size={24} /> : <Edit3 size={24} />}
          </button>
        </div>
      </NavContext.Provider>
    </EditContext.Provider>
  );
};

export default App;
