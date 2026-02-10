import Box from '@mui/material/Box';

/**
 * Fondo corporativo con gradiente suave blanco/rosado
 */
export default function AnimatedBackground() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 50%, #fce7f3 100%)',
      }}
    >
      {/* Patrón sutil de puntos */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, rgba(236,72,153,0.08) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Forma decorativa superior */}
      <Box
        sx={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)',
          top: '-15%',
          right: '-10%',
          filter: 'blur(40px)',
        }}
      />

      {/* Forma decorativa inferior */}
      <Box
        sx={{
          position: 'absolute',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.05) 0%, transparent 70%)',
          bottom: '-10%',
          left: '-8%',
          filter: 'blur(35px)',
        }}
      />
    </Box>
  );
}
