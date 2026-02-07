// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { alpha, Box, Typography } from "@mui/material";
// import { CheckCircle } from "lucide-react"; // لو مش عندك lucide-react قولي وهنبدله بـ react-icons

// type DialogStepperProps = {
//     steps: string[];
//     activeStep: number; // 0-based
//     theme: any;
// };

// function DialogStepper({ steps, activeStep, theme }: DialogStepperProps) {
//     return (
//         <Box sx={{ mb: 3 }}>
//             <Box
//                 sx={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     position: "relative",
//                     px: 1,
//                 }}
//             >
//                 {/* line */}
//                 <Box
//                     sx={{
//                         position: "absolute",
//                         top: "30%",
//                         left: "10%",
//                         width: "80%",
//                         height: 2,
//                         bgcolor: alpha(theme.currentPalette.primary, 0.15),
//                         zIndex: 0,
//                     }}
//                 />

//                 {steps.map((label, i) => {
//                     const isActive = i === activeStep;
//                     const isCompleted = i < activeStep;

//                     return (
//                         <Box
//                             key={i}
//                             sx={{
//                                 display: "flex",
//                                 flexDirection: "column",
//                                 alignItems: "center",
//                                 zIndex: 1,
//                                 minWidth: 80,
//                             }}
//                         >
//                             <Box
//                                 sx={{
//                                     width: 44,
//                                     height: 44,
//                                     borderRadius: "50%",
//                                     border: "3px solid",
//                                     borderColor:
//                                         isActive || isCompleted
//                                             ? theme.currentPalette.primary
//                                             : alpha(theme.currentPalette.text, 0.2),
//                                     bgcolor: isCompleted
//                                         ? theme.currentPalette.primary
//                                         : isActive
//                                             ? theme.currentPalette.primary
//                                             : theme.currentPalette.background,
//                                     color: isCompleted || isActive ? "#fff" : theme.currentPalette.text,
//                                     display: "flex",
//                                     alignItems: "center",
//                                     justifyContent: "center",
//                                     fontWeight: 700,
//                                 }}
//                             >
//                                 {isCompleted ? <CheckCircle size={22} /> : i + 1}
//                             </Box>

//                             <Typography
//                                 sx={{
//                                     mt: 1,
//                                     fontSize: 13,
//                                     fontWeight: 600,
//                                     textAlign: "center",
//                                     color: isActive
//                                         ? theme.currentPalette.primary
//                                         : alpha(theme.currentPalette.text, 0.6),
//                                 }}
//                             >
//                                 {label}
//                             </Typography>
//                         </Box>
//                     );
//                 })}
//             </Box>
//         </Box>
//     );
// }
