# Solar Sclipse

> An interactive 3D total solar eclipse simulator and historical eclipse archive.

**Live demo:** [solar-sclipse.taaissu.workers.dev](https://solar-sclipse.taaissu.workers.dev/)

Solar Sclipse is a browser-based orbital and ground-sky visualization for exploring the **12 August 2026 total solar eclipse** and selected historical total solar eclipses. The simulator combines a rotatable Earth, a moving umbral path, observation-point telemetry, a timeline scrubber, ground sky view, and replayable archive scenarios in one responsive interface.

## Highlights

| Area | Included experience |
|---|---|
| 3D globe | Interactive Earth view with a visible eclipse route and moving shadow |
| 2026 simulation | Path of totality, observation stations, local clock readouts, and playback controls |
| Historical archive | Replay scenarios for notable eclipses including 2134 BCE, 585 BCE, 1715, 1851, 1868, 1919, 1991, 1999, 2009, 2017, and 2024 |
| Replay mode | Scenario-specific date, route checkpoints, stations, timeline bounds, telemetry, and sky-view state |
| Responsive UI | Clean desktop layout plus mobile controls with explicit minimize and expand actions |
| Accessibility | Keyboard-focus states, descriptive labels, reduced-motion support, and high-contrast controls |

## Run locally

You need **Node.js 18 or newer** and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:3000`.

To create a production build:

```bash
npm run build
npm run preview
```

## How to use it

Start with the default 2026 eclipse simulation, then use **Archive** to browse historical scenarios. Select **Replay Simulation** on an archive card to load that eclipse's own route, date, observation stations, timing window, telemetry, and sky view. The left timeline and right observation panel can be independently minimized when you want a clearer globe view.

## Technology

The project is built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Three.js**. The production build is served through a Cloudflare Worker at the live demo URL.

## Repository topics

`solar-eclipse` `eclipse-simulator` `astronomy` `space` `threejs` `react` `typescript` `vite` `cloudflare-workers` `interactive-visualization` `science-education`

## Attribution and data notes

The archive is a curated educational collection. Historical route geometry is represented as an interactive route overview; source links and event metadata are provided in the application for further reading. This project is intended for exploration and education rather than precision ephemeris or navigation work.

## License

This project is available under the MIT License. See [`LICENSE`](LICENSE) for details.

## References

[1]: https://eclipse.gsfc.nasa.gov/SEhistory/SEhistory.html "NASA Eclipse Web Site: Solar Eclipse History"
[2]: https://eclipse.gsfc.nasa.gov/SEcatmax/SE2021-2030.html "NASA Eclipse Web Site: Solar Eclipses 2021–2030"

#solar-eclipse #eclipse-simulator #astronomy #space #threejs #react #typescript #vite #cloudflare-workers #interactive-visualization #science-education
