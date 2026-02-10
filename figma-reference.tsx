//import svgPaths from "./svg-xx3y04bbqs";
const svgPaths: Record<string, string> = new Proxy(
  {},
  {
    get: () => '',
  },
);
const imgImage49 = "http://localhost:3845/assets/9aa29549346b4779cb3d24f55980b96fff749de5.png";
const imgImage47 = "http://localhost:3845/assets/6b53d9897bd434f7b14c643b8461c055dadb39f1.png";
const imgRectangle121 = "http://localhost:3845/assets/52eb81526ed03a76a3674e2f4127f504b98dbe16.png";
const imgRectangle122 = "http://localhost:3845/assets/17f01c326fef07fb6780233cacd13a00f8e0bad9.png";
const imgRectangle123 = "http://localhost:3845/assets/c4fd4bcb77d41538f29efbbc295860e24e4cb066.png";

function FishLogo() {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[10px] items-center justify-center left-[48px] p-px size-[48px] top-[24px]" data-name="Fish Logo">
      <div className="aspect-[46/38.4615] relative shrink-0 w-full" data-name="image 49">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage49} />
      </div>
    </div>
  );
}

function Frame234() {
  return (
    <div className="basis-0 content-stretch flex gap-[8px] grow items-center min-h-px min-w-px relative shrink-0">
      <div className="overflow-clip relative shrink-0 size-[16px]" data-name="Search">
        <div className="absolute inset-[12.5%]" data-name="Icon">
          <div className="absolute inset-[-6.667%]" style={{ "--stroke-0": "rgba(87, 83, 78, 1)" } as React.CSSProperties}>
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
              <path d={svgPaths.p8625680} id="Icon" stroke="var(--stroke-0, #57534E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
            </svg>
          </div>
        </div>
      </div>
      <p className="font-['Albert_Sans:Regular',sans-serif] font-normal leading-none relative shrink-0 text-[14px] text-nowrap text-stone-600 whitespace-pre">Try entering recipe URL</p>
    </div>
  );
}

function Frame245() {
  return (
    <div className="bg-stone-900 box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-nowrap text-stone-50 whitespace-pre">Parse Recipe</p>
    </div>
  );
}

function Frame287() {
  return (
    <div className="content-stretch flex gap-[10px] h-full items-center relative shrink-0">
      <p className="font-['Albert_Sans:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-none relative shrink-0 text-[14px] text-nowrap text-stone-600 whitespace-pre">⌘+K</p>
      <Frame245 />
    </div>
  );
}

function Search() {
  return (
    <div className="absolute bg-stone-100 left-1/2 rounded-[9999px] top-[24px] translate-x-[-50%] w-[600px]" data-name="Search">
      <div className="box-border content-stretch flex gap-[8px] items-center overflow-clip pl-[16px] pr-[6px] py-[6px] relative rounded-[inherit] w-[600px]">
        <Frame234 />
        <div className="flex flex-row items-center self-stretch">
          <Frame287 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-[-0.5px] pointer-events-none rounded-[9999.5px]" />
    </div>
  );
}

function Frame244() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border-[1.225px] border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Sign In</p>
    </div>
  );
}

function Frame247() {
  return (
    <div className="bg-[#154df6] box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-nowrap text-stone-50 whitespace-pre">Get Started</p>
    </div>
  );
}

function Frame296() {
  return (
    <div className="absolute content-stretch flex gap-[10px] h-[48px] items-center left-[1183px] top-[24px]">
      <Frame244 />
      <Frame247 />
    </div>
  );
}

function NavBar() {
  return (
    <div className="bg-white h-[96px] relative shrink-0 w-[1440px]" data-name="Nav Bar">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none" />
      <FishLogo />
      <Search />
      <Frame296 />
    </div>
  );
}

function Frame284() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <div className="h-[35.739px] relative shrink-0 w-[43.5px]" data-name="image 47">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[310.87%] left-[-17.24%] max-w-none top-[-172.37%] w-[255.4%]" src={imgImage47} />
        </div>
      </div>
      <p className="font-['Domine:Regular',sans-serif] font-normal leading-[1.1] relative shrink-0 text-[24px] text-black text-nowrap whitespace-pre">{`Parse & Plate`}</p>
    </div>
  );
}

function Frame216() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-center justify-center relative shrink-0">
      <Frame284 />
      <div className="font-['Domine:Regular',sans-serif] font-normal leading-[1.1] relative shrink-0 text-[64px] text-black text-center text-nowrap whitespace-pre">
        <p className="mb-0">Clean recipes,</p>
        <p>fast cooking.</p>
      </div>
      <p className="font-['Albert_Sans:Regular',sans-serif] font-normal leading-[1.4] relative shrink-0 text-[14px] text-center text-nowrap text-stone-900 whitespace-pre">Spend less time on ad-filled recipes and more time cooking.</p>
    </div>
  );
}

function Frame254() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border-[1.225px] border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Sign In</p>
    </div>
  );
}

function Frame255() {
  return (
    <div className="bg-stone-900 box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-nowrap text-stone-50 whitespace-pre">Get Started</p>
    </div>
  );
}

function Frame299() {
  return (
    <div className="content-stretch flex gap-[10px] h-[48px] items-center relative shrink-0">
      <Frame254 />
      <Frame255 />
    </div>
  );
}

function Frame295() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center justify-center relative shrink-0">
      <Frame216 />
      <Frame299 />
    </div>
  );
}

function Frame288() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-full">
      <Frame295 />
    </div>
  );
}

function Frame256() {
  return (
    <div className="bg-stone-200 box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Asian</p>
    </div>
  );
}

function Frame258() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Italian</p>
    </div>
  );
}

function Frame246() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Mexican</p>
    </div>
  );
}

function Frame248() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Mediterranean</p>
    </div>
  );
}

function Frame249() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">French</p>
    </div>
  );
}

function Frame250() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Indian</p>
    </div>
  );
}

function Frame251() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Japanese</p>
    </div>
  );
}

function Frame252() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Korean</p>
    </div>
  );
}

function Frame253() {
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">Hawaiian</p>
    </div>
  );
}

function Frame257() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[1000px]" />
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-black text-nowrap whitespace-pre">More 12+</p>
    </div>
  );
}

function Frame285() {
  return (
    <div className="content-center flex flex-wrap gap-[8px] items-center relative shrink-0 w-full">
      <Frame256 />
      <Frame258 />
      <Frame246 />
      <Frame248 />
      <Frame249 />
      <Frame250 />
      <Frame251 />
      <Frame252 />
      <Frame253 />
      <Frame257 />
    </div>
  );
}

function Frame300() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-0 py-[24px] relative shrink-0 w-full">
      <Frame285 />
    </div>
  );
}

function Frame301() {
  return (
    <div className="content-stretch flex gap-[10px] items-center justify-center relative shrink-0">
      <div className="h-[35.739px] relative shrink-0 w-[43.5px]" data-name="image 47">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[295.1%] left-[-130.68%] max-w-none top-[-27.67%] w-[247.34%]" src={imgImage47} />
        </div>
      </div>
      <p className="font-['Domine:Regular',sans-serif] font-normal leading-[1.1] relative shrink-0 text-[32px] text-black text-nowrap whitespace-pre">Asian</p>
    </div>
  );
}

function Frame289() {
  return (
    <div className="content-stretch flex flex-col font-normal gap-[4px] items-start justify-center overflow-clip relative shrink-0 text-nowrap w-full whitespace-pre">
      <p className="font-['Domine:Regular',sans-serif] leading-[1.1] relative shrink-0 text-[24px] text-stone-50">Beef Udon</p>
      <p className="font-['Albert_Sans:Regular',sans-serif] leading-[1.4] relative shrink-0 text-[0px] text-[14px] text-stone-50 text-stone-950">
        <span>{`By `}</span>Namiko Hirasawa Chen
      </p>
    </div>
  );
}

function Frame290() {
  return (
    <div className="basis-0 bg-[#686758] grow min-h-px min-w-px relative rounded-[8px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[8px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-start p-[24px] relative w-full">
          <div className="aspect-[282.667/204] relative rounded-[8px] shrink-0 w-full">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8px] size-full" src={imgRectangle121} />
          </div>
          <Frame289 />
        </div>
      </div>
    </div>
  );
}

function Frame302() {
  return (
    <div className="content-stretch flex flex-col font-normal gap-[4px] items-start justify-center relative shrink-0 text-nowrap w-full whitespace-pre">
      <p className="font-['Domine:Regular',sans-serif] leading-[1.1] relative shrink-0 text-[24px] text-black">Garlic Shrimp Ramen</p>
      <p className="font-['Albert_Sans:Regular',sans-serif] leading-[1.4] relative shrink-0 text-[14px] text-stone-900">By Cameron Tillman</p>
    </div>
  );
}

function Frame291() {
  return (
    <div className="basis-0 bg-stone-50 grow min-h-px min-w-px relative rounded-[8px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[8px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-start p-[24px] relative w-full">
          <div className="aspect-[282.667/204] relative rounded-[8px] shrink-0 w-full">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8px] size-full" src={imgRectangle122} />
          </div>
          <Frame302 />
        </div>
      </div>
    </div>
  );
}

function Frame303() {
  return (
    <div className="content-stretch flex flex-col font-normal gap-[4px] items-start justify-center relative shrink-0 text-nowrap w-full whitespace-pre">
      <p className="font-['Domine:Regular',sans-serif] leading-[1.1] relative shrink-0 text-[24px] text-black">Mushroom Risotto</p>
      <p className="font-['Albert_Sans:Regular',sans-serif] leading-[1.4] relative shrink-0 text-[0px] text-[14px] text-stone-900 text-stone-950">
        <span>{`By `}</span>Darrell Schroeder
      </p>
    </div>
  );
}

function Frame292() {
  return (
    <div className="basis-0 bg-stone-50 grow min-h-px min-w-px relative rounded-[8px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[8px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-start p-[24px] relative w-full">
          <div className="aspect-[282.667/204] relative rounded-[8px] shrink-0 w-full">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8px] size-full" src={imgRectangle123} />
          </div>
          <Frame303 />
        </div>
      </div>
    </div>
  );
}

function Frame293() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
      <Frame290 />
      <Frame291 />
      <Frame292 />
    </div>
  );
}

function Frame304() {
  return (
    <div className="content-stretch flex flex-col font-normal gap-[4px] items-start justify-center relative shrink-0 text-nowrap w-full whitespace-pre">
      <p className="font-['Domine:Regular',sans-serif] leading-[1.1] relative shrink-0 text-[24px] text-black">Beef Udon</p>
      <p className="font-['Albert_Sans:Regular',sans-serif] leading-[1.4] relative shrink-0 text-[0px] text-[14px] text-stone-900 text-stone-950">
        <span>{`By `}</span>Namiko Hirasawa Chen
      </p>
    </div>
  );
}

function Frame305() {
  return (
    <div className="basis-0 bg-stone-50 grow min-h-px min-w-px relative rounded-[8px] shrink-0">
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[8px]" />
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-start p-[24px] relative w-full">
          <div className="aspect-[460/204] relative rounded-[8px] shrink-0 w-full">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[8px] size-full" src={imgRectangle121} />
          </div>
          <Frame304 />
        </div>
      </div>
    </div>
  );
}

function Frame294() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
      {[...Array(2).keys()].map((_, i) => (
        <Frame305 key={i} />
      ))}
    </div>
  );
}

function Frame259() {
  return (
    <div className="bg-stone-900 box-border content-stretch flex gap-[8px] items-center justify-center px-[20px] py-[8px] relative rounded-[1000px] shrink-0">
      <p className="font-['Albert_Sans:Medium',sans-serif] font-medium leading-[1.4] relative shrink-0 text-[14px] text-nowrap text-stone-50 whitespace-pre">Find Recipe</p>
    </div>
  );
}

function Frame298() {
  return (
    <div className="absolute box-border content-stretch flex flex-col gap-[10px] items-start justify-center left-[38px] p-[10px] top-[42px]">
      <div className="font-['Domine:Regular',sans-serif] font-normal leading-[1.1] relative shrink-0 text-[48px] text-nowrap text-stone-50 whitespace-pre">
        <p className="mb-0">Clean recipes,</p>
        <p>fast cooking.</p>
      </div>
      <Frame259 />
      <p className="font-['Inter:Regular',sans-serif] font-normal leading-none not-italic relative shrink-0 text-[16px] text-nowrap text-stone-50 whitespace-pre">© Parse and Plate 2025</p>
    </div>
  );
}

function Frame79() {
  return (
    <div className="absolute h-[411.163px] left-0 top-[103.08px] w-[589px]">
      <div className="absolute inset-[-1.05%_-0.74%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 598 420">
          <g id="Frame 79">
            <g filter="url(#filter0_gn_1_236)" id="Vector 31">
              <path d={svgPaths.p683ab80} fill="var(--fill-0, #2686FF)" />
            </g>
            <g filter="url(#filter1_gn_1_236)" id="Vector 30">
              <path d={svgPaths.p2d4a3500} fill="var(--fill-0, #154DF6)" />
            </g>
            <g filter="url(#filter2_gn_1_236)" id="Vector 32">
              <path d={svgPaths.p2a5ffdc0} fill="var(--fill-0, #2686FF)" />
            </g>
            <g filter="url(#filter3_gn_1_236)" id="Vector 33">
              <path d={svgPaths.p128a0d80} fill="var(--fill-0, #636BFF)" />
            </g>
            <g filter="url(#filter4_gn_1_236)" id="Vector 34">
              <path d={svgPaths.p14132f00} fill="var(--fill-0, #FFFAF6)" />
            </g>
            <g filter="url(#filter5_g_1_236)" id="Vector 36">
              <path d={svgPaths.p11986e00} fill="var(--fill-0, #0C0A09)" />
            </g>
            <g filter="url(#filter6_gn_1_236)" id="Vector 37">
              <path d={svgPaths.p37cffc00} fill="var(--fill-0, #2686FF)" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="192.114" id="filter0_gn_1_236" width="210.21" x="252.112" y="8.36662">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="8.6704540252685547" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_236">
                <feMergeNode in="displacedImage" />
              </feMerge>
              <feTurbulence baseFrequency="0.14261241257190704 0.14261241257190704" numOctaves="3" result="noise" seed="4021" stitchTiles="stitch" type="fractalNoise" />
              <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
              </feComponentTransfer>
              <feComposite in="coloredNoise1" in2="effect1_texture_1_236" operator="in" result="noise1Clipped" />
              <feFlood floodColor="rgba(255, 255, 255, 0.15)" result="color1Flood" />
              <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
              <feMerge result="effect2_noise_1_236">
                <feMergeNode in="effect1_texture_1_236" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="419.833" id="filter1_gn_1_236" width="597.67" x="-1.12042e-07" y="4.75214e-05">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="8.6704540252685547" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_236">
                <feMergeNode in="displacedImage" />
              </feMerge>
              <feTurbulence baseFrequency="0.14261241257190704 0.14261241257190704" numOctaves="3" result="noise" seed="4021" stitchTiles="stitch" type="fractalNoise" />
              <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
              </feComponentTransfer>
              <feComposite in="coloredNoise1" in2="effect1_texture_1_236" operator="in" result="noise1Clipped" />
              <feFlood floodColor="rgba(255, 255, 255, 0.15)" result="color1Flood" />
              <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
              <feMerge result="effect2_noise_1_236">
                <feMergeNode in="effect1_texture_1_236" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="135.207" id="filter2_gn_1_236" width="124.948" x="137.324" y="234.209">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="8.6704540252685547" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_236">
                <feMergeNode in="displacedImage" />
              </feMerge>
              <feTurbulence baseFrequency="0.14261241257190704 0.14261241257190704" numOctaves="3" result="noise" seed="4021" stitchTiles="stitch" type="fractalNoise" />
              <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
              </feComponentTransfer>
              <feComposite in="coloredNoise1" in2="effect1_texture_1_236" operator="in" result="noise1Clipped" />
              <feFlood floodColor="rgba(255, 255, 255, 0.15)" result="color1Flood" />
              <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
              <feMerge result="effect2_noise_1_236">
                <feMergeNode in="effect1_texture_1_236" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="214.466" id="filter3_gn_1_236" width="227.325" x="5.38744e-05" y="1.01631e-08">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="8.6704540252685547" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_236">
                <feMergeNode in="displacedImage" />
              </feMerge>
              <feTurbulence baseFrequency="0.14261241257190704 0.14261241257190704" numOctaves="3" result="noise" seed="4021" stitchTiles="stitch" type="fractalNoise" />
              <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
              </feComponentTransfer>
              <feComposite in="coloredNoise1" in2="effect1_texture_1_236" operator="in" result="noise1Clipped" />
              <feFlood floodColor="rgba(255, 255, 255, 0.15)" result="color1Flood" />
              <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
              <feMerge result="effect2_noise_1_236">
                <feMergeNode in="effect1_texture_1_236" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="90.6919" id="filter4_gn_1_236" width="88.6589" x="90.1943" y="26.186">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="8.6704540252685547" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_236">
                <feMergeNode in="displacedImage" />
              </feMerge>
              <feTurbulence baseFrequency="0.14261241257190704 0.14261241257190704" numOctaves="3" result="noise" seed="4021" stitchTiles="stitch" type="fractalNoise" />
              <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
              </feComponentTransfer>
              <feComposite in="coloredNoise1" in2="effect1_texture_1_236" operator="in" result="noise1Clipped" />
              <feFlood floodColor="rgba(255, 255, 255, 0.15)" result="color1Flood" />
              <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
              <feMerge result="effect2_noise_1_236">
                <feMergeNode in="effect1_texture_1_236" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="60.2858" id="filter5_g_1_236" width="57.3758" x="103.668" y="42.567">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="5.0044236183166504" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_236">
                <feMergeNode in="displacedImage" />
              </feMerge>
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="97.4815" id="filter6_gn_1_236" width="106.098" x="193.862" y="121.587">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="8.6704540252685547" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_236">
                <feMergeNode in="displacedImage" />
              </feMerge>
              <feTurbulence baseFrequency="0.14261241257190704 0.14261241257190704" numOctaves="3" result="noise" seed="4021" stitchTiles="stitch" type="fractalNoise" />
              <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
              </feComponentTransfer>
              <feComposite in="coloredNoise1" in2="effect1_texture_1_236" operator="in" result="noise1Clipped" />
              <feFlood floodColor="rgba(255, 255, 255, 0.15)" result="color1Flood" />
              <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
              <feMerge result="effect2_noise_1_236">
                <feMergeNode in="effect1_texture_1_236" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="h-[114.333px] relative w-[175.993px]">
      <div className="absolute inset-[-3.79%_-2.46%_-3.79%_-2.37%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 185 123">
          <g id="Group 4">
            <g filter="url(#filter0_gn_1_227)" id="Vector 42">
              <path d={svgPaths.p25e4ef70} fill="var(--fill-0, #FFFCFA)" />
            </g>
            <path d={svgPaths.p177fcc00} fill="var(--fill-0, #F2ECE8)" id="Vector 43 (Stroke)" />
            <path d={svgPaths.p3eb58a00} fill="var(--fill-0, #F2ECE8)" id="Vector 44 (Stroke)" />
            <path d={svgPaths.p2a357400} fill="var(--fill-0, #F2ECE8)" id="Vector 45 (Stroke)" />
            <path d={svgPaths.p22f2f000} fill="var(--fill-0, #F2ECE8)" id="Vector 46 (Stroke)" />
            <g filter="url(#filter1_gn_1_227)" id="Vector 41">
              <path d={svgPaths.p238ca00} fill="var(--fill-0, #FFFCFA)" />
            </g>
            <g filter="url(#filter2_gn_1_227)" id="Vector 41 (Stroke)">
              <path d={svgPaths.p38831f80} fill="var(--fill-0, #F2ECE8)" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="89.8192" id="filter0_gn_1_227" width="184.492" x="-1.78814e-07" y="1.24113e-07">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="8.6704540252685547" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_227">
                <feMergeNode in="displacedImage" />
              </feMerge>
              <feTurbulence baseFrequency="0.14261241257190704 0.14261241257190704" numOctaves="3" result="noise" seed="4021" stitchTiles="stitch" type="fractalNoise" />
              <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
              </feComponentTransfer>
              <feComposite in="coloredNoise1" in2="effect1_texture_1_227" operator="in" result="noise1Clipped" />
              <feFlood floodColor="rgba(255, 255, 255, 0.15)" result="color1Flood" />
              <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
              <feMerge result="effect2_noise_1_227">
                <feMergeNode in="effect1_texture_1_227" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="67.6355" id="filter1_gn_1_227" width="127.225" x="28.6445" y="51.3169">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="8.6704540252685547" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_227">
                <feMergeNode in="displacedImage" />
              </feMerge>
              <feTurbulence baseFrequency="0.14261241257190704 0.14261241257190704" numOctaves="3" result="noise" seed="4021" stitchTiles="stitch" type="fractalNoise" />
              <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
              </feComponentTransfer>
              <feComposite in="coloredNoise1" in2="effect1_texture_1_227" operator="in" result="noise1Clipped" />
              <feFlood floodColor="rgba(255, 255, 255, 0.15)" result="color1Flood" />
              <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
              <feMerge result="effect2_noise_1_227">
                <feMergeNode in="effect1_texture_1_227" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="74.4868" id="filter2_gn_1_227" width="130.907" x="26.8028" y="48.5165">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
              <feTurbulence baseFrequency="0.058253549039363861 0.058253549039363861" numOctaves="3" seed="5990" type="fractalNoise" />
              <feDisplacementMap height="100%" in="shape" result="displacedImage" scale="8.6704540252685547" width="100%" xChannelSelector="R" yChannelSelector="G" />
              <feMerge result="effect1_texture_1_227">
                <feMergeNode in="displacedImage" />
              </feMerge>
              <feTurbulence baseFrequency="0.14261241257190704 0.14261241257190704" numOctaves="3" result="noise" seed="4021" stitchTiles="stitch" type="fractalNoise" />
              <feColorMatrix in="noise" result="alphaNoise" type="luminanceToAlpha" />
              <feComponentTransfer in="alphaNoise" result="coloredNoise1">
                <feFuncA tableValues="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 " type="discrete" />
              </feComponentTransfer>
              <feComposite in="coloredNoise1" in2="effect1_texture_1_227" operator="in" result="noise1Clipped" />
              <feFlood floodColor="rgba(255, 255, 255, 0.15)" result="color1Flood" />
              <feComposite in="color1Flood" in2="noise1Clipped" operator="in" result="color1" />
              <feMerge result="effect2_noise_1_227">
                <feMergeNode in="effect1_texture_1_227" />
                <feMergeNode in="color1" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Frame81() {
  return (
    <div className="absolute h-[514.238px] right-[53px] top-[31px] w-[589px]">
      <Frame79 />
      <div className="absolute flex h-[calc(1px*((var(--transform-inner-width)*0.26124873757362366)+(var(--transform-inner-height)*0.965271532535553)))] items-center justify-center left-[101.23px] top-0 w-[calc(1px*((var(--transform-inner-height)*0.26124873757362366)+(var(--transform-inner-width)*0.965271532535553)))]" style={{ "--transform-inner-width": "175.984375", "--transform-inner-height": "114.328125" } as React.CSSProperties}>
        <div className="flex-none rotate-[15.144deg]">
          <Group4 />
        </div>
      </div>
    </div>
  );
}

function Frame308() {
  return (
    <div className="bg-stone-950 h-[337px] overflow-clip relative rounded-[16px] shrink-0 w-full">
      <Frame298 />
      <Frame81 />
    </div>
  );
}

function Frame309() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <Frame293 />
      <Frame294 />
      <Frame308 />
    </div>
  );
}

function Frame297() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-start px-[200px] py-0 relative w-full">
          <Frame300 />
          <Frame301 />
          <Frame309 />
        </div>
      </div>
    </div>
  );
}

function Frame339() {
  return (
    <div className="h-[25px] relative shrink-0 w-[24px]">
      <div className="absolute left-1/2 size-[24px] top-[calc(50%+0.5px)] translate-x-[-50%] translate-y-[-50%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" fill="var(--fill-0, #D9D9D9)" id="Ellipse 37" r="12" />
        </svg>
      </div>
      <div className="absolute left-1/2 overflow-clip size-[12px] top-[calc(50%+0.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="Search">
        <div className="absolute inset-[12.5%]" data-name="Icon">
          <div className="absolute inset-[-6.667%]" style={{ "--stroke-0": "rgba(87, 83, 78, 1)" } as React.CSSProperties}>
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
              <path d={svgPaths.p1da2dd80} id="Icon" stroke="var(--stroke-0, #57534E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame338() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <Frame339 />
      <p className="font-['Albert_Sans:Regular',sans-serif] font-normal leading-[1.4] relative shrink-0 text-[14px] text-nowrap text-stone-900 whitespace-pre">Beef Udon</p>
    </div>
  );
}

function Frame260() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[8px] relative rounded-[500px] shrink-0">
      <div aria-hidden="true" className="absolute border-[0.5px] border-solid border-stone-200 inset-0 pointer-events-none rounded-[500px]" />
      <p className="font-['Albert_Sans:Regular',sans-serif] font-normal leading-[1.4] relative shrink-0 text-[10px] text-black text-nowrap whitespace-pre">Asian</p>
    </div>
  );
}

function Frame337() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-[568px]">
      <Frame338 />
      <Frame260 />
    </div>
  );
}

function Frame340() {
  return (
    <div className="h-[25px] relative shrink-0 w-[24px]">
      <div className="absolute left-1/2 size-[24px] top-[calc(50%+0.5px)] translate-x-[-50%] translate-y-[-50%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" fill="var(--fill-0, #D9D9D9)" id="Ellipse 37" r="12" />
        </svg>
      </div>
      <div className="absolute left-1/2 overflow-clip size-[12px] top-[calc(50%+0.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="Search">
        <div className="absolute inset-[12.5%]" data-name="Icon">
          <div className="absolute inset-[-6.667%]" style={{ "--stroke-0": "rgba(87, 83, 78, 1)" } as React.CSSProperties}>
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
              <path d={svgPaths.p1da2dd80} id="Icon" stroke="var(--stroke-0, #57534E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame341() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <Frame340 />
      <p className="font-['Albert_Sans:Regular',sans-serif] font-normal leading-[1.4] relative shrink-0 text-[14px] text-nowrap text-stone-900 whitespace-pre">Beef Wellington</p>
    </div>
  );
}

function Frame261() {
  return (
    <div className="box-border content-stretch flex gap-[4px] items-center justify-center px-[10px] py-[8px] relative rounded-[500px] shrink-0">
      <div aria-hidden="true" className="absolute border-[0.5px] border-solid border-stone-200 inset-0 pointer-events-none rounded-[500px]" />
      <p className="font-['Albert_Sans:Regular',sans-serif] font-normal leading-[1.4] relative shrink-0 text-[10px] text-black text-nowrap whitespace-pre">Asian</p>
    </div>
  );
}

function Frame342() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-[568px]">
      <Frame341 />
      <Frame261 />
    </div>
  );
}

function Frame336() {
  return (
    <div className="absolute bg-white left-[calc(50%+0.5px)] rounded-[8px] top-[-15px] translate-x-[-50%] w-[599px]">
      <div className="box-border content-stretch flex flex-col gap-[12px] items-center overflow-clip p-[24px] relative rounded-[inherit] w-[599px]">
        <Frame337 />
        <Frame342 />
      </div>
      <div aria-hidden="true" className="absolute border border-solid border-stone-200 inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Frame310() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[24px] items-start pb-[54px] pt-[48px] px-0 relative shrink-0 w-[1440px]">
      <Frame288 />
      <Frame297 />
      <Frame336 />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="bg-stone-50 box-border content-stretch flex flex-col items-center justify-center relative shadow-[0px_16px_32px_-4px_rgba(12,12,13,0.1),0px_4px_4px_-4px_rgba(12,12,13,0.05)] size-full" data-name="Landing Page">
      <NavBar />
      <Frame310 />
    </div>
  );
}
