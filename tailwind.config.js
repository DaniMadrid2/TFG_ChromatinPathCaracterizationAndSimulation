/*
Color palette:
#1 FEFED5
#2 252525
#3 2D2D2D
#4 1E1E1E
#5 1D1D1D
#6 454645
#7 3F3F3F
#8 36AF9D
*/
//1f252f

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{html,js,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:{
          dark:'#1D1D1D',
          light:'#2D2D2D',
          darker:'#1E1E1F',
        },
        secondary:'#36AF9D',
        secondary2:{
          bright:'#36e4ca',
          dark:'#2ecdb5',
        },
        secondary3:{
          bright:'#4cfffc',
          bright:'#42e0de',
        },
        terciary:'#FEFED5',
        primary2:{
          dark:'#252525',
          light:'#3F3F3F'
        },
        oscuros:{
          azul:'#1E1028',
          negro:'#0B000D',
          azul2:'#1F0714',
          rojo:'#260202',
          rojo2:'#320B0C',
          rojo3:'#42101B',
          violeta:'#94283F',
          violeta2:'#99364C',
          blancoazulado:'#F2F7F1',
          rosablancoazulado:'#D9A18F',
        },
        uno:'#122C34',
        one:'#122C34',
        dos:'#224870',
        two:'#224870',
        tres:'#2A4494',
        four:'#3C75B7',
        five:'#4EA5D9',
        seis:'#4EA5D9',
        olive:'#44CFCB',
        china_rose:'#AF5D7D',
        licorice_negro:'#191216',
        licorice_marron:'#302122',
        rose_quartz:'#A69696',
        platinum:'#D5D8E0',
        cream:'#e3d9d8',
        chat:{
          azul:{
            oscuro:"#003366",
            serio:"#003366",
            vibrante_oscuro:"#073dff",
            claro:"#4d91d1",
            medio:"#0050BC",
            vibrante:"#0077CC",
            justo:"rgb(50 169 204)"
          },
          gris:{
            carbon:"#333333",
            legible:"#333333",
            claro:"#F0F0F0",
            suave:"#F0F0F0"
          },
          blanco:"#FFFFFF",
          acento:"#6699CC"
        },
        backgrounds:{
          black:"rgb(10,10,10)",
          blueblack:"rgb(10,10,17)",  //Blue black
          blueblackl:"rgb(10,10,52)",  //Blue black light
          bblueblack:"rgb(1,10,12)",  //blue Blue black
          violetblack:"rgb(10,1,22)",
          bvioletblack:"rgb(10,15,22)",  //Blue violet black
          veischblack:"rgb(45,14,22)",
          pinkblack:"rgb(65,14,42)"

          
        },
        grupos:{
          azules:{
            uno:'#122C34',
            one:'#122C34',
            dos:'#224870',
            tres:'#2A4494',
            four:'#3C75B7',
            five:'#4EA5D9',
            seis:'#4EA5D9',
          },
          amarillos:{
            uno: '#423D0F',
            one: '#423D0F',
            dos: '#847C1F',
            tres: '#B1A434',
            four: '#D6C949',
            five: '#F3EE5E',
            seis: '#F3EE5E',
          },
          rojos:{
            uno: '#330D0F',
            one: '#330D0F',
            dos: '#661A1F',
            tres: '#992628',
            four: '#CC3234',
            five: '#FF3E40',
            seis: '#FF3E40',
          },
          verdes:{
            uno: '#1A331D',
            one: '#1A331D',
            dos: '#336635',
            tres: '#4D994E',
            four: '#66CC66',
            five: '#80FF7F',
            seis: '#80FF7F',
          },
          grises:{
            uno: '#252525',
            one: '#252525',
            dos: '#494949',
            tres: '#6E6E6E',
            four: '#929292',
            five: '#B7B7B7',
            seis: '#B7B7B7',

          },
          magentas:{
            uno: '#330D1A',
            one: '#330D1A',
            dos: '#661A33',
            tres: '#99264D',
            four: '#CC3366',
            five: '#FF4080',
            seis: '#FF4080',
          },
          rosas:{
            uno: '#33151A',
            one: '#33151A',
            dos: '#662A33',
            tres: '#994D66',
            four: '#CC6699',
            five: '#FF80B3',
            seis: '#FF80B3',
          },
          violetas:{
            uno: '#1A0D33',
            one: '#1A0D33',
            dos: '#331A66',
            tres: '#4D2699',
            four: '#6633CC',
            five: '#8040FF',
            seis: '#8040FF',
          },
          marrones:{
            uno: '#2C1D11',
            one: '#2C1D11',
            dos: '#584C22',
            tres: '#867B34',
            four: '#B3A945',
            five: '#E0D757',
            seis: '#E0D757',
          },
          azulcielos:{
            uno: '#0D1E33',
            one: '#0D1E33',
            dos: '#1A3C66',
            tres: '#264D99',
            four: '#3366CC',
            five: '#4080FF',
            seis: '#4080FF',
          },
          fondos:{
            uno: '#F5F5F5', // Blanco humo, para fondos limpios y claros.
            one: '#F5F5F5',
            dos: '#EDEDED', // Gris muy claro, para cuando se necesita un contraste sutil.
            tres: '#E0E0E0', // Gris claro, bueno para fondos de secciones o tarjetas.
            four: '#CCCCCC', // Gris medio, útil para dividir áreas sin un contraste fuerte.
            five: '#B3B3B3', // Gris oscuro claro, para fondos de elementos destacados o footers.
            seis: '#999999', // Gris oscuro, ideal para texto con fondo claro o para fondos de encabezados.
          }
        }
      },
      screens: {
        'xxsm':'375px',
        'xsm':'420px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        'scr200':'200px',
        'scr300':'300px',
        'scr400':'400px',
        'scr500':'500px',
        'scr600':'600px',
        'scr700':'700px',
        'scr800':'800px',
        'scr900':'900px',
        'scr1000':'1000px',
        'scr1100':'1100px',
        'scr1200':'1200px',
      },
      fontFamily:{
        serif:["Georgia",'Cambria','Times','serif'],
        computer: ['"Computer Modern"', 'sans-serif'],
        noto:['"Noto Sans Math"', 'sans-serif'],
      },
      textColor:{
        primary:'white',
        secondary:'blue'
      },
      fontSize: {
        'h1': 'var(--dnti-fontSize-h1,3.01rem)', //3.01rem
        'hmid': 'var(--dnti-fontSize-hmid,2.336rem)', //2.336rem
        'h2': 'var(--dnti-fontSize-h2,1.860rem)', //1.860rem
        'h3': 'var(--dnti-fontSize-h3,1.4628rem)', //1.4628rem
        'body': 'var(--dnti-fontSize-body,1.15rem)', //1.15rem
        'small': 'var(--dnti-fontSize-small,0.904rem)', //0.904rem
        'xsmall': 'var(--dnti-fontSize-xsmall,0.7107rem)', //0.7107rem
      },
      spacing: {
        '4': 'var(--dnti-spacing-4,1rem)', //1rem
        '6': 'var(--dnti-spacing-6,1.5rem)', //1.5rem
        '8': 'var(--dnti-spacing-8,2rem)', //2rem
        '10': 'var(--dnti-spacing-10,2.5rem)', //2.5rem
        '12': 'var(--dnti-spacing-12,3rem)', //3rem
        'space-1': 'var(--dnti-spacing-space-1,0.5rem)', //0.5rem
        'space-2': 'var(--dnti-spacing-space-2,1rem)', //1rem
        'space-3': 'var(--dnti-spacing-space-3,1.5rem)', //1.5rem
        'space-4': 'var(--dnti-spacing-space-4,2rem)', //2rem
      },
      typography: ({theme}) => ({
        blog: {
          css: {
            color: 'black',
            a: {
              color: theme('colors.secondary'),
              '&:hover': {
                color: theme('colors.secondary2.bright'),
              },
            },
            h1: {
              fontSize: theme('fontSize.h1'),
              marginBottom: theme('spacing.6'),
              color: theme('colors.chat.azul.vibrante_oscuro'), // Color de h1
              width: "fit-content",
              overflowWrap:"normal",
              wordBreak:"normal",
            },
            h2: {
              fontSize: theme('fontSize.h2'),
              marginBottom: theme('spacing.4'),
              color: theme('colors.chat.azul.vibrante'), // Color de h2
              marginLeft: '2px',
              width: "fit-content",
              overflowWrap:"normal",
              wordBreak:"normal",
            },
            h3: {
              fontSize: theme('fontSize.h3'),
              marginBottom: theme('spacing.3'),
              color: theme('colors.chat.azul.vibrante'), // Color de h3
              marginLeft: '4px',
              width: "fit-content",
              overflowWrap:"normal",
              wordBreak:"normal",
            },
            p: {
              marginBottom: theme('spacing.4'),
              lineHeight: 1.5, // Altura de línea para mejor legibilidad
              fontSize: theme('fontSize.body'),
              color: 'black', // Color de los párrafos en modo claro
              width: "fit-content",
              overflowWrap:"normal",
              wordBreak:"normal",
            }
            // Ajusta otros elementos según sea necesario
          },
        },
        blogdark: {
          css: {
            color: theme('colors.platinum'),
            a: {
              color: theme('colors.secondary'),
              '&:hover': {
                color: theme('colors.secondary2.bright'),
              },
            },
            h1: {
              color: theme('colors.chat.azul.vibrante'), // Color de h1 en modo oscuro
            },
            h2: {
              color: theme('colors.chat.azul.justo'), // Color de h2 en modo oscuro
              
            },
            h3: {
              color: theme('colors.secondary'), // Color de h3 en modo oscuro
            },
            p: {
              marginBottom: theme('spacing.4'),
              lineHeight: '1.5', // Altura de línea para mejor legibilidad
              fontSize: theme('fontSize.body'),
              color: theme('colors.chat.gris.suave'), // Color de los párrafos en modo oscuro
              maxWidth:"unset",
            }
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // ...
  ],
}

