import {defineConfig,devices} from '@playwright/test'

const local=process.env.ASH_BROWSER_LOCAL==='true'

export default defineConfig({
  testDir:'./specs',
  outputDir:'test-results',
  fullyParallel:true,
  forbidOnly:!!process.env.CI,
  retries:process.env.CI?1:0,
  workers:2,
  maxFailures:6,
  timeout:45_000,
  expect:{timeout:12_000},
  reporter:[['line'],['html',{outputFolder:'playwright-report',open:'never'}],['json',{outputFile:'test-results/results.json'}]],
  use:{
    baseURL:local?'http://127.0.0.1:3100':process.env.ASH_BROWSER_BASE_URL||'https://app-gold-workspace.vercel.app',
    navigationTimeout:30_000,
    actionTimeout:12_000,
    locale:'de-DE',
    colorScheme:'light',
    reducedMotion:'reduce',
    trace:'retain-on-failure',
    screenshot:'only-on-failure',
    video:'retain-on-failure'
  },
  webServer:local?{command:'npm --prefix ../.. run start -- --port 3100',url:'http://127.0.0.1:3100/entdecken',reuseExistingServer:false,timeout:60_000}:undefined,
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},
    {name:'android-emulation',use:{...devices['Pixel 7']}},
    {name:'iphone-webkit-emulation',use:{...devices['iPhone 13']}}
  ]
})
