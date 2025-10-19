// src/data/systemSpecs.ts

export interface Component {
  label: string;
  value: string | MonitorDetail[];
  notes?: string;
  link?: string;
}
export interface SoftwareDetail {
  label: string;
  value: string;
  notes?: string;
}

export interface MonitorDetail {
  model: string;
  role?: string;
  size?: string;
  refreshRate?: string;
  notes?: string;
  link?: string;
}

export interface SystemDetails {
  name: string;
  description?: string;
  specs?: Component[];
  accessories?: Component[];
  peripherals?: Component[];
  softwareAndOS?: SoftwareDetail[];
}

export const allSystemSpecs: SystemDetails[] = [
  {
    name: "Main PC",
    description:
      "My Super Mega Epic Amazing Computer Build 3000! This is my primary workstation and gaming rig, built for performance and reliability.",
    specs: [
      { label: "CPU",
        value: "AMD Ryzen 5 5600X",
        link: "https://www.amd.com/en/products/processors/desktops/ryzen/5000-series/amd-ryzen-5-5600x.html"
      },
      {
        label: "GPU",
        value: "ASUS Radeon RX 6600 Dual OC 8GB GDDR6",
        link: "https://www.asus.com/graphics-cards/dual-rx6600-8g/"
      },
      { label: "RAM", value: "Kingston Fury DDR4 3600MHz 4x8gb CL16",
        link: "https://www.kingston.com/en/memory/gaming/kingston-fury-beast-ddr4-memory"
      },
      { label: "Motherboard", value: "ASUS TUF B450 Plus II",
        link: "https://www.asus.com/motherboards-components/motherboards/tuf-gaming/tuf-gaming-b450-plus-ii/"
      },
      {
        label: "Storage (NVMe) (Linux)",
        value: "Apacer AS2280Q4X 2TB",
        link: "https://www.apacer.com/en/product/personal-product/detail/personal_ssd/as2280q4x"
      },
      {
        label: "Storage (SATA) (Windows 10)",
        value: 'Patriot Burst SATA 2,5" 120GB',
        link: "https://www.patriotmemory.com/products/burst-elite-sata-iii-2-5-ssd"
      },
      { label: "Storage (HDD)", value: 'TOSHIBA DT01ACA100 1TB 3,5"' },
      { label: "CPU Cooler", value: "Stock AMD Wraith Stealth" },
      { label: "Power Supply", value: "Corsair RM750e", link: "https://www.corsair.com/us/en/p/psu/cp-9020277-na/rm750e-2023-80-plus-gold-fully-modular-low-noise-atx-power-supply-750-watt-cp-9020277-na" },
      { label: "Case", value: "Gamemax Draco xD", link: "https://gamemaxpc.com/alpha/931.html"}
    ],
    peripherals: [
      {
        label: "Monitor",
        value: [
          {
            model: "Xiaomi P27FBB-RGGL",
            role: "Main",
            size: '27"',
            refreshRate: "165Hz",
            link: "https://www.mi.com/global/product/xiaomi-gaming-monitor-g27i/specs/",
          },
          {
            model: "Xiaomi P27FBB-RGGL",
            role: "Secondary",
            size: '27"',
            refreshRate: "165Hz",
            link: "https://www.mi.com/global/product/xiaomi-gaming-monitor-g27i/specs/",
          },
        ],
      },
      { label: "Keyboard", value: "Dark Project KD83A", link: "https://old.darkproject.eu/keyboards/dark-project-kd83a-blue/" },
      { label: "Mouse", value: "Logitech G305", link: "https://www.logitech.com/en-us/products/mice/g305-lightspeed-wireless-gaming-mouse.html" },
      { label: "Headset", value: "CZC.gaming Seraphim", link: "https://www.czc.cz/czc-gaming-seraphim/362415/produkt" },
      { label: "Microphone", value: "Fifine T732",
        link: "https://fifinemicrophone.com/products/fifine-t732-studio-usb-microphone-kit?_pos=1&_sid=472a709f2&_ss=r"
      },
      { label: "Mousepad", value: "CZC.gaming Barricade XXL RGB" },
      { label: "Controller", value: "Xbox 360 Wired White (not working)" },
    ],
    softwareAndOS: [
      {
        label: "System",
        value: "Dual Boot: Arch Linux / Windows 10 IoT Enterprise LTSC",
      },
      {
        label: "Primary OS",
        value: "Arch Linux + Hypergay (Omarchy)",
        notes:
          "I use arch btw.",
      },
      {
        label: "Windows Use",
        value: "Gaming & Specific Software",
        notes: "Windows is used mainly for kernel anti-cheat games.",
      },
    ],
  },
  {
    name: "Server PC",
    description:
      "Super mega epic server computer build 4000! This machine handles all my server needs, including Streaming legally obtained Jellyfin stuff and file storage (kinda)",
    specs: [
      { label: "CPU", value: "Intel Core i5-3450" },
      {
        label: "GPU",
        value: "Sapphire Toxic R9 280X 3gb GDDR5 OC",
      },
      { label: "RAM", value: "Green. 4x4gb DDR3 1600MT/s" },
      { label: "Motherboard", value: "ASUS P8B75-V" },
      { label: "Storage (HDD)", value: 'WD BLUE 250GB 3.5"' },
      {
        label: "Power Supply",
        value: "BOMB 650W",
        notes: "It runs and didn't explode yet.",
      },
      { label: "Case", value: "Yes. (No.)" },
    ],
    softwareAndOS: [
      {
        label: "System",
        value: "Arch Linux",
      },
    ],
  },
  {
    name: "Other Accessories that I own",
    description:
      "From my Phones to other funny shits",
    accessories: [
      { label: "Main Phone", value: "Google Pixel 8 Pro [Husky]", notes: "Running GrapheneOS + KSU", link: "https://store.google.com/product/pixel_8_pro" },
      {
        label: "Backup + Testing Phone",
        value: "Sony Xperia XA2 H3113 [Pioneer]",
        notes: "Running LineageOS 23.0",
        link: "https://www.sony.co.uk/electronics/support/mobile-phones-tablets-mobile-phones/xperia-xa2"
      },
      { label: "Silly old phone on my desk", value: "Sony Xperia Z1 Compact [Amami]", notes: "Pixel Experience + Magisk Alpha", link: "https://www.sony.co.th/en/electronics/support/mobile-phones-tablets-mobile-phones/xperia-z1-compact" },
      { label: "Phone for apps that need strong integrity", value: "Infinix Note 12 2023", notes: "Don't know it's codename, stock", link: "https://my.infinixmobility.com/NOTE-12-2023" },
      { label: "Xbox", value: "Xbox 360 Phat", notes: "Running ABadAvatar Exploit alongside XeUnshackle", link: "https://en.wikipedia.org/wiki/Xbox_360"},
      { label: "Playstation", value: "Playstation 1", notes: "Currently Broken.", link: "https://en.wikipedia.org/wiki/PlayStation_(console)" },
      { label: "Earphones", value: 'Earfun Air Pro 3 ', notes: "for phone", link: "https://www.myearfun.com/headphones/earfun-air-pro-3-le-audio-anc-true-wireless-earbuds-black"},
      {
        label: "Smartwatch",
        value: "TicWatch Pro 3 Ultra GPS",
        link: "https://www.mobvoi.com/eu/pages/ticwatchpro3ultra"
      },
      { label: "Insulin Pump", value: "T:Slim X2 Insulin pump", link: "https://www.tandemdiabetes.com/products/t-slim-x2-insulin-pump" },
    ],
  },
]