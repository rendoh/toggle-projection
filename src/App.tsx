import { useEffect, useRef, useState, VFC } from "react";

const THRESHOLD = 96

const width = 64 / 2;
const height = 48 / 2;

const App: VFC = () => {
  const [map, setMap] = useState(() => {
    return [...Array(height)].map(() => (
      [...Array(width)].map(() => false))
    );
  })
  const videoElementRef = useRef<null | HTMLVideoElement>(null);
  const canvasElementRef = useRef<null | HTMLCanvasElement>(null);
  const rafId = useRef<number | null>(0);
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    })
      .then(stream => {
        const videoElement = videoElementRef.current;
        if (!videoElement) return;
        videoElement.srcObject = stream;
        videoElement.play();
      });
  }, []);

  useEffect(() => {
    const videoElement = videoElementRef.current;
    const canvasElement = canvasElementRef.current;
    if (!canvasElement || !videoElement) return;

    const updateCanvas = () => {
      const context = canvasElement.getContext('2d');
      context?.drawImage(videoElement, 0, 0, width, height);
      const src = context?.getImageData(0, 0, width, height);
      const dist = context?.createImageData(width, height);
      for (let i = 0; i < src!.data.length; i += 4) {
        let y = 0.2126 * src!.data[i] + 0.7152 * src!.data[i + 1] + 0.0722 * src!.data[i + 2]
        y = parseInt((y as any), 10)
        if (y > THRESHOLD) {
          y = 255
        } else {
          y = 0
        }
        dist!.data[i] = y
        dist!.data[i + 1] = y
        dist!.data[i + 2] = y
        dist!.data[i + 3] = src!.data[i + 3]
      }
      context?.putImageData(dist!, 0, 0)

      const result = context?.getImageData(0, 0, width, height);
      const filledMap = [...Array(height)].map(() => ([] as boolean[]));
      for (let i = 0; i < result!.data.length; i += 4) {
        filledMap[Math.floor((i / 4) / width)].push(result!.data[i] === 0);
      }
      setMap(filledMap);

      rafId.current = window.setTimeout(updateCanvas, 10);
    }
    updateCanvas();

    return () => {
      if (typeof rafId.current === 'number') {
        clearTimeout(rafId.current);
      }
    }
  }, []);

  return (
    <>
      <video
        ref={videoElementRef}
          style={{
          width: width * 3,
          height: height * 3,
        }}
      />
      <canvas
        ref={canvasElementRef}
        width={width}
        height={height}
        style={{
          width: width * 3,
          height: height * 3,
        }}
      />
      <div>
        {map.map((row, rowIndex) => (
          <div key={rowIndex} style={{ height: 30 }}>
            {row.map((filled, columnIndex) => (
              <span key={columnIndex} style={{
                width: 30,
                height: 30,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Switch checked={filled} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </>
  )
};

export default App

const Switch: VFC<{ checked: boolean }> = ({ checked }) => (
  <span style={{
    display: 'inline-block',
    width: 25,
    height: 18,
    background: 'rgb(229, 229, 229)',
    borderRadius: 50,
    position: 'relative',
    transition: 'all 0.22s ease-out',
  }}>
    <input type="checkbox" checked={checked} readOnly style={{ opacity: 0 }} />
    <span style={{
      display: 'block',
      position: 'absolute',
      width: '100%',
      height:'100%',
      top: 0,
      left: 0,
      borderRadius: 50,
      background: '#44db5e',
      transition: 'all 0.22s ease-out',
      transform: checked ? 'scale(1)' : 'scale(0)'
    }} />
    <span style={{
      display: 'block',
      width: 14,
      height: 14,
      background: '#fff',
      position: 'absolute',
      top: 2,
      left: 2,
      borderRadius: '50%',
      transform: checked ? 'translateX(8px)' : 'translateX(0)',
      transition: 'all 0.22s ease-out',
    }} />
  </span>
)