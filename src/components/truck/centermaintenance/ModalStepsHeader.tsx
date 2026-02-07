// "use client";

// import React from "react";
// import { Box, Typography } from "@mui/material";

// type Props = {
//   step: 1 | 2;
//   primaryColor: string;
//   leftLabel?: string;
//   rightLabel?: string;
// };

// export default function ModalStepsHeader({
//   step,
//   primaryColor,
//   leftLabel = "General Information",
//   rightLabel = "Operational Details",
// }: Props) {
//   const isStep2 = step === 2;

//   return (
//     <Box sx={{ px: 2, pt: 2 }}>
//       {/* circles + line */}
//       <Box sx={{ position: "relative", height: 36 }}>
//         {/* line background */}
//         <Box
//           sx={{
//             position: "absolute",
//             left: 14,
//             right: 14,
//             top: 14,
//             height: 2,
//             borderRadius: "999px",
//             backgroundColor: "#D6E6FF",
//           }}
//         />

//         {/* line progress */}
//         <Box
//           sx={{
//             position: "absolute",
//             left: 14,
//             top: 14,
//             height: 2,
//             borderRadius: "999px",
//             backgroundColor: primaryColor,
//             width: isStep2 ? "100%" : "50%",
//             transition: "width .2s ease",
//           }}
//         />

//         {/* left circle (1) */}
//         <Box
//           sx={{
//             position: "absolute",
//             left: 0,
//             top: 4,
//             width: 28,
//             height: 28,
//             borderRadius: "999px",
//             display: "grid",
//             placeItems: "center",
//             fontSize: 12,
//             fontWeight: 800,
//             color: "#fff",
//             backgroundColor: primaryColor,
//             border: `1px solid ${primaryColor}`,
//             zIndex: 2,
//           }}
//         >
//           1
//         </Box>

//         {/* right circle (2) */}
//         <Box
//           sx={{
//             position: "absolute",
//             right: 0,
//             top: 4,
//             width: 28,
//             height: 28,
//             borderRadius: "999px",
//             display: "grid",
//             placeItems: "center",
//             fontSize: 12,
//             fontWeight: 800,
//             color: isStep2 ? "#fff" : "#94A3B8",
//             backgroundColor: isStep2 ? primaryColor : "#fff",
//             border: isStep2 ? `1px solid ${primaryColor}` : "1px solid #D6E6FF",
//             zIndex: 2,
//           }}
//         >
//           2
//         </Box>
//       </Box>

//       {/* labels */}
//       <Box
//         sx={{
//           mt: 0.5,
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "flex-start",
//         }}
//       >
//         <Typography sx={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>
//           {leftLabel}
//         </Typography>

//         <Typography
//           sx={{
//             fontSize: 12,
//             fontWeight: 800,
//             color: isStep2 ? "#0F172A" : "#CBD5E1",
//           }}
//         >
//           {rightLabel}
//         </Typography>
//       </Box>
//     </Box>
//   );
// }
