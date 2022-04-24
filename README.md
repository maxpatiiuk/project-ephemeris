# Project: Ephemeris

A full-fledged calendar application with support for multiple calendars,
repeated events and best of all, dark mode. Has four view modes (year, month,
week and day).

Build with React, Next.JS and Tailwind. Uses MySQL/MariaDB for storage.



## Development

```zsh
npm i       # install dependencies
npm run dev # start development server
```

This would start the development server at
[http://locahlost:3000](http://locahlost:3000).

## Production

```zsh
npm i         # install dependencies
npm run build # begin the build process
npm run start # start production server
```

This would start the production server at
[http://locahlost:3000](http://locahlost:3000).

Afterward, you can deploy this site at [https://vercel.com](https://vercel.com).

Alternatively, you can configure a reverse proxy (e.x Nginx) that would handle
the SSL certificate and forward the requests to port 80, which should be made
externally available.

## Code Credit

Majority of the start code was repurposed and reused from another project of
mine: [max.patii.uk (my portfolio)](https://max.patii.uk).

Additionally, some files have been copied/inspired by another project I am a
member of: [Specify 7](http://github.com/specify/specify7).

## Origin of the name

The name “Ephemeris” is an archaic word in astronomy that stands for a book with
tables that gives the trajectory of naturally occurring astronomical objects as
well as artificial satellites in the sky.