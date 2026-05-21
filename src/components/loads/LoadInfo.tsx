"use client";
import { useGetLoadByMongoIdQuery } from "@/redux/slices/apiSlice";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Tab,
  Tabs,
  Card,
  CardContent,
  List,
  ListItem,
  Divider,
  Link,
  Button,
  Stack,
  alpha,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useEffect, useState } from "react";
import {
  LocalShipping,
  Person,
  DirectionsCar,
  Note,
  Schedule,
  LocationOn,
  Phone,
  AttachMoney,
  CalendarToday,
  Description,
  Visibility,
  Close,
} from "@mui/icons-material";
import Loading from "@/components/ui/Loading";
import Erros from "@/components/ui/Erros";
import {
  InfoCardProps,
  InfoItemProps,
  TabPanelProps,
  TComments,
  TDocument,
  TLoads,
} from "@/types/globalTypes";
import { MdEdit } from "react-icons/md";
import AddNoteModal from "@/components/loads/AddNoteModal";
import { RxUpdate } from "react-icons/rx";
import CreateEditLoadModal from "@/components/loads/CreateEditLoadModal";
import UpdateStatusModal from "@/components/loads/UpdateStatusModal";
import { IoRefresh } from "react-icons/io5";
import { RootState, useAppSelector } from "@/redux/store";
import { useSearchParams } from "next/navigation";

interface LoadInfoProps {
  loadId: string | undefined;
}

// handling Tabs
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`load-tabpanel-${index}`}
      aria-labelledby={`load-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const LoadInfo = ({ loadId }: LoadInfoProps) => {
  const [tabValue, setTabValue] = useState(0);
  const [viewNoteDialog, setViewNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<TComments | null>(null);
  const [notes, setNotes] = useState<TComments[]>([]);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const theme = useAppSelector((state: RootState) => state.palette);
  // decode and clean the loadId
  const decodedLoadId = loadId ? decodeURIComponent(loadId).trim() : "";
  const searchParams = useSearchParams();
  const {
    data,
    isLoading: loadLoading,
    refetch: refetchLoads,
  } = useGetLoadByMongoIdQuery(decodedLoadId);
  const [editingLoad, setEditingLoad] = useState<TLoads | null>(null);
  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);

  // Refetching for coming from notify
  useEffect(() => {
    refetchLoads()
  }, [])

  useEffect(() => {
    const tab = searchParams.get("tab");
    const parsed = tab ? Number(tab) : 0;
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 2) {
      setTabValue(parsed);
    } else {
      setTabValue(0);
    }
  }, [searchParams]);
  // Handling Change Tabs
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handling View Note Details
  const handleViewNote = (note: TComments) => {
    setSelectedNote(note);
    setViewNoteDialog(true);
  };

  // TODO: Open Edit Load
  const openEditLoadPopup = async (loadItem: TLoads) => {
    if (!loadItem?.id) return;
    setEditingLoad(loadItem);
    setShowCreateEditModal(true);
  };

  // Handling Close Note Modal
  const handleCloseNoteDialog = () => {
    setViewNoteDialog(false);
    setSelectedNote(null);
  };

  // Set Loading
  if (loadLoading) return <Loading />;

  // Set Data
  const load = data?.data.find((item: TLoads) => {
    const itemLoadId = String(item.id).trim();
    const searchLoadId = String(decodedLoadId).trim();
    return itemLoadId === searchLoadId;
  });
  if (!load) return <Erros message="No load details found for this ID." />;
  const allNotes = [...notes, ...(load.comments || [])];

  const InfoCard = ({ title, icon, children }: InfoCardProps) => (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        border: `1px solid ${alpha(theme.currentPalette.text, 0.2)}`,
        borderRadius: 2,
        bgcolor: theme.currentPalette.background,
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box
            sx={{
              color: theme.currentPalette.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: alpha(theme.currentPalette.primary, 0.1),
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h6"
            color={theme.currentPalette.primary}
            fontWeight="600"
          >
            {title}
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
  const InfoItem = ({ icon, primary, secondary }: InfoItemProps) => (
    <ListItem sx={{ px: 0, py: 1.5 }}>
      <Stack
        direction="row"
        spacing={2}
        alignItems="flex-start"
        sx={{
          width: "100%",
        }}
      >
        <Box
          sx={{
            color: theme.currentPalette.secondary,
            mt: 0.2,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body2"
            fontWeight="500"
            color={theme.currentPalette.title}
            gutterBottom
          >
            {primary}
          </Typography>
          <Typography
            variant="body2"
            color={theme.currentPalette.text}
            sx={{ lineHeight: 1.4 }}
          >
            {secondary}
          </Typography>
        </Box>
      </Stack>
    </ListItem>
  );

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          my: 5,
          bgcolor: theme.currentPalette.background,
          border: `1px solid ${alpha(theme.currentPalette.text, 0.2)}`,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              color={theme.currentPalette.text}
              fontWeight="700"
            >
              Load ({load.loadId})
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={load.status.toUpperCase()}
                variant="outlined"
                sx={{
                  fontWeight: 600,
                  borderWidth: 1.5,
                  color: theme.currentPalette.primary,
                }}
              />
              <Typography
                variant="body2"
                color={theme.currentPalette.secondary}
              >
                Created by {load.createdBy}
              </Typography>
            </Stack>
          </Box>
          <Box textAlign="right">
            <Typography
              variant="h4"
              color={theme.currentPalette.primary}
              fontWeight="700"
            >
              ${load.totalPrice}
            </Typography>
            <Typography variant="body2" color={theme.currentPalette.secondary}>
              {load.currency}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          overflow: "hidden",
          bgcolor: theme.currentPalette.background,
          border: `1px solid ${alpha(theme.currentPalette.text, 0.2)}`,
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="load details tabs"
          sx={{
            borderBottom: `1px solid ${alpha(theme.currentPalette.text, 0.1)}`,
            bgcolor: theme.currentPalette.background,
            px: 2,
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab
            icon={<LocalShipping />}
            label="Load & Driver & Truck"
            iconPosition="start"
            sx={{
              fontWeight: 500,
              py: 2,
              minHeight: 64,
              color: theme.currentPalette.secondary,
              "&.Mui-selected": {
                color: theme.currentPalette.primary,
              },
            }}
          />
          <Tab
            icon={<Note />}
            label="Notes"
            iconPosition="start"
            sx={{
              fontWeight: 500,
              py: 2,
              minHeight: 64,
              color: theme.currentPalette.secondary,
              "&.Mui-selected": {
                color: theme.currentPalette.primary,
              },
            }}
          />
          <Tab
            icon={<Schedule />}
            label="Appointments"
            iconPosition="start"
            sx={{
              fontWeight: 500,
              py: 2,
              minHeight: 64,
              color: theme.currentPalette.secondary,
              "&.Mui-selected": {
                color: theme.currentPalette.secondary,
              },
            }}
          />
        </Tabs>

        {/* Tab 1: Load, Driver & Truck */}
        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              mb: 3,
              display: "flex",
              justifyContent: "flex-end",
              borderRadius: 2,
            }}
          >
            <Button
              onClick={() => openEditLoadPopup(load)}
              variant="contained"
              startIcon={<RxUpdate />}
              sx={{
                py: 1.5,
                px: 4,
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: 2,
                textTransform: "none",
                width: { xs: "100%", lg: "auto" },
                background: `linear-gradient(135deg, ${theme.currentPalette.primary}, ${theme.currentPalette.secondary})`,
                color: "#fff",
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.currentPalette.secondary}, ${theme.currentPalette.primary})`,
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Update Load
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Load Information */}
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard title="Load Information" icon={<LocalShipping />}>
                <List dense sx={{ py: 0 }}>
                  <InfoItem
                    icon={<LocationOn fontSize="small" />}
                    primary="Origin"
                    secondary={load.origin}
                  />
                  <Divider
                    sx={{ borderColor: alpha(theme.currentPalette.text, 0.2) }}
                  />
                  <InfoItem
                    icon={<LocationOn fontSize="small" />}
                    primary="DHO"
                    secondary={load.DHO}
                  />
                  <Divider
                    sx={{ borderColor: alpha(theme.currentPalette.text, 0.2) }}
                  />
                  <InfoItem
                    icon={<LocationOn fontSize="small" />}
                    primary="Destination"
                    secondary={
                      Array.isArray(load.destination)
                        ? load.destination.join(", ")
                        : load.destination
                    }
                  />
                </List>
              </InfoCard>
            </Grid>

            {/* Trip Details */}
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard title="Trip Details" icon={<CalendarToday />}>
                <List dense sx={{ py: 0 }}>
                  <InfoItem
                    icon={<Schedule fontSize="small" />}
                    primary="Pickup Time"
                    secondary={new Date(load.pickupAt).toLocaleString()}
                  />
                  <Divider
                    sx={{ borderColor: alpha(theme.currentPalette.text, 0.2) }}
                  />
                  <InfoItem
                    icon={<Schedule fontSize="small" />}
                    primary="Completed At"
                    secondary={new Date(load.completedAt).toLocaleString()}
                  />
                  <Divider
                    sx={{ borderColor: alpha(theme.currentPalette.text, 0.2) }}
                  />
                  {/* <InfoItem
                    icon={<AttachMoney fontSize="small" />}
                    primary="Price Details"
                    secondary={`${load.distanceMiles
                      } miles • $${load.pricePerMile.toFixed(2)}/mile`}
                  /> */}
                  <InfoItem
                    icon={<AttachMoney fontSize="small" />}
                    primary="Price Details"
                    secondary={`${load.distanceMiles != null
                        ? Math.trunc(Number(load.distanceMiles))
                        : "-"
                      } miles • ${load.pricePerMile != null
                        ? `$${Number(load.pricePerMile)}`
                        : "-"
                      }/mile`}
                  />
                </List>
              </InfoCard>
            </Grid>

            {/* Driver Information */}
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard title="Driver Information" icon={<Person />}>
                {load.driverId ? (
                  <List dense sx={{ py: 0 }}>
                    <InfoItem
                      icon={<Person fontSize="small" />}
                      primary="Driver Name"
                      secondary={load.driverId.name}
                    />
                    <Divider
                      sx={{
                        borderColor: alpha(theme.currentPalette.text, 0.2),
                      }}
                    />
                    <InfoItem
                      icon={<Phone fontSize="small" />}
                      primary="Phone Number"
                      secondary={load.driverId.phone}
                    />
                    <Divider
                      sx={{
                        borderColor: alpha(theme.currentPalette.text, 0.2),
                      }}
                    />
                    <InfoItem
                      icon={<LocalShipping fontSize="small" />}
                      primary="Driver ID"
                      secondary={load.driverId.driverId}
                    />
                  </List>
                ) : (
                  <Typography
                    variant="body2"
                    color={theme.currentPalette.secondary}
                    textAlign="center"
                    py={3}
                  >
                    No driver assigned
                  </Typography>
                )}
              </InfoCard>
            </Grid>

            {/* Truck Information */}
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard title="Truck Information" icon={<DirectionsCar />}>
                {load.truckId ? (
                  <List dense sx={{ py: 0 }}>
                    <InfoItem
                      icon={<DirectionsCar fontSize="small" />}
                      primary="Truck Model"
                      secondary={load.truckId.model}
                    />
                    <Divider
                      sx={{
                        borderColor: alpha(theme.currentPalette.text, 0.2),
                      }}
                    />
                    <InfoItem
                      icon={<LocalShipping fontSize="small" />}
                      primary="Plate Number"
                      secondary={load.truckId.plateNumber}
                    />
                    <Divider
                      sx={{
                        borderColor: alpha(theme.currentPalette.text, 0.2),
                      }}
                    />
                    <InfoItem
                      icon={<LocalShipping fontSize="small" />}
                      primary="Truck Type"
                      secondary={load.truckType}
                    />
                    <Divider
                      sx={{
                        borderColor: alpha(theme.currentPalette.text, 0.2),
                      }}
                    />
                    <InfoItem
                      icon={<LocalShipping fontSize="small" />}
                      primary="Temperature"
                      secondary={`${load.truckTemp}°C`}
                    />
                  </List>
                ) : (
                  <Typography
                    variant="body2"
                    color={theme.currentPalette.secondary}
                    textAlign="center"
                    py={3}
                  >
                    No truck assigned
                  </Typography>
                )}
              </InfoCard>
            </Grid>

            {/* Documents */}
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard title="Documents" icon={<Description />}>
                {load.documents?.length > 0 ? (
                  <List dense sx={{ py: 0 }}>
                    {load.documents.map((doc: TDocument, i: number) => (
                      <Box key={i}>
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          {doc.viewLink ? (
                            <Link
                              href={doc.viewLink}
                              target="_blank"
                              rel="noopener"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                textDecoration: "none",
                                color: theme.currentPalette.primary,
                                "&:hover": {
                                  color: alpha(
                                    theme.currentPalette.primary,
                                    0.8
                                  ),
                                  textDecoration: "underline",
                                },
                              }}
                            >
                              <Description fontSize="small" />
                              <Typography variant="body2" fontWeight="500">
                                Document {i + 1}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography
                              variant="body2"
                              color={theme.currentPalette.secondary}
                            >
                              No link available
                            </Typography>
                          )}
                        </ListItem>
                        {i < load.documents.length - 1 && (
                          <Divider
                            sx={{
                              borderColor: alpha(
                                theme.currentPalette.text,
                                0.2
                              ),
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body2"
                    color={theme.currentPalette.secondary}
                    textAlign="center"
                    py={3}
                  >
                    No documents available
                  </Typography>
                )}
              </InfoCard>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <InfoCard title="Documents For Driver" icon={<Description />}>
                {load.documentsForDriver?.length > 0 ? (
                  <List dense sx={{ py: 0 }}>
                    {load.documentsForDriver.map((doc: TDocument, i: number) => (
                      <Box key={i}>
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          {doc.viewLink ? (
                            <Link
                              href={doc.viewLink}
                              target="_blank"
                              rel="noopener"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                textDecoration: "none",
                                color: theme.currentPalette.primary,
                                "&:hover": {
                                  color: alpha(
                                    theme.currentPalette.primary,
                                    0.8
                                  ),
                                  textDecoration: "underline",
                                },
                              }}
                            >
                              <Description fontSize="small" />
                              <Typography variant="body2" fontWeight="500">
                                Document {i + 1}
                              </Typography>
                            </Link>
                          ) : (
                            <Typography
                              variant="body2"
                              color={theme.currentPalette.secondary}
                            >
                              No link available
                            </Typography>
                          )}
                        </ListItem>
                        {i < load.documents.length - 1 && (
                          <Divider
                            sx={{
                              borderColor: alpha(
                                theme.currentPalette.text,
                                0.2
                              ),
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </List>
                ) : (
                  <Typography
                    variant="body2"
                    color={theme.currentPalette.secondary}
                    textAlign="center"
                    py={3}
                  >
                    No documents available
                  </Typography>
                )}
              </InfoCard>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Notes */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, md: 12 }}>
              <Card
                variant="outlined"
                sx={{
                  border: `1px solid ${alpha(theme.currentPalette.text, 0.1)}`,
                  borderRadius: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  bgcolor: theme.currentPalette.background,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Add Note*/}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 3 }}
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          color: theme.currentPalette.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          bgcolor: alpha(theme.currentPalette.primary, 0.1),
                        }}
                      >
                        <Description />
                      </Box>
                      <Typography
                        variant="h6"
                        color={theme.currentPalette.primary}
                        fontWeight="600"
                      >
                        Previous Notes ({allNotes.length})
                      </Typography>
                    </Stack>

                    <Button
                      onClick={() => setShowAddNoteModal(true)}
                      variant="contained"
                      startIcon={<MdEdit size={16} />}
                      sx={{
                        py: 1.5,
                        px: 4,
                        fontWeight: "bold",
                        fontSize: "1rem",
                        borderRadius: 2,
                        textTransform: "none",
                        width: { xs: "100%", lg: "auto" },
                        background: `linear-gradient(135deg, ${theme.currentPalette.primary}, ${theme.currentPalette.secondary})`,
                        color: "#fff",
                        "&:hover": {
                          background: `linear-gradient(135deg, ${theme.currentPalette.secondary}, ${theme.currentPalette.primary})`,
                          transform: "translateY(-1px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      Add Note
                    </Button>
                  </Stack>

                  {allNotes.length > 0 ? (
                    <List sx={{ maxHeight: 400, overflow: "auto" }}>
                      {allNotes.map((comment: TComments, index: number) => (
                        <Box key={comment.id || index}>
                          <ListItem
                            alignItems="flex-start"
                            sx={{ px: 0, py: 2 }}
                          >
                            <Stack spacing={1.5} sx={{ width: "100%" }}>
                              <Box
                                sx={{
                                  bgcolor: alpha(
                                    theme.currentPalette.primary,
                                    0.03
                                  ),
                                  p: 2,
                                  borderRadius: 2,
                                  border: `1px solid ${alpha(
                                    theme.currentPalette.text,
                                    0.1
                                  )}`,
                                  position: "relative",
                                }}
                              >
                                <Typography variant="body2" sx={{ pr: 4 }}>
                                  {comment.text || comment.content}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewNote(comment)}
                                  sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    color: theme.currentPalette.primary,
                                    "&:hover": {
                                      backgroundColor:
                                        theme.currentPalette.primary,
                                      color: "white",
                                    },
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Box>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="caption"
                                  color={theme.currentPalette.secondary}
                                >
                                  {comment.createdAt
                                    ? `Added on ${new Date(
                                      comment.createdAt
                                    ).toLocaleString()}`
                                    : "No date available"}
                                </Typography>
                                {comment.addedBy && (
                                  <Typography
                                    variant="caption"
                                    color={theme.currentPalette.primary}
                                    fontWeight="500"
                                  >
                                    By: {comment.addedBy}
                                  </Typography>
                                )}
                              </Stack>
                            </Stack>
                          </ListItem>
                          {index < allNotes.length - 1 && (
                            <Divider
                              sx={{
                                my: 1,
                                borderColor: alpha(
                                  theme.currentPalette.text,
                                  0.2
                                ),
                              }}
                            />
                          )}
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={6}>
                      <Note
                        sx={{
                          fontSize: 48,
                          color: theme.currentPalette.secondary,
                          mb: 2,
                          opacity: 0.5,
                        }}
                      />
                      <Typography
                        variant="body2"
                        color={theme.currentPalette.secondary}
                      >
                        No notes available yet
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Appointments */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={() => setShowUpdateStatusModal(true)}
              variant="contained"
              startIcon={<IoRefresh size={18} />}
              sx={{
                py: 1.5,
                px: 4,
                fontWeight: "bold",
                fontSize: "1rem",
                borderRadius: 2,
                textTransform: "none",
                width: { xs: "100%", lg: "auto" },
                background: `linear-gradient(135deg, ${theme.currentPalette.primary}, ${theme.currentPalette.secondary})`,
                color: "#fff",
                "&:hover": {
                  background: `linear-gradient(135deg, ${theme.currentPalette.secondary}, ${theme.currentPalette.primary})`,
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Update Status
            </Button>
          </Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Card
                variant="outlined"
                sx={{
                  bgcolor: theme.currentPalette.background,
                  border: `1px solid ${theme.currentPalette.text}`,
                  borderRadius: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 3 }}
                  >
                    <Box
                      sx={{
                        color: theme.currentPalette.primary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: alpha(theme.currentPalette.primary, 0.1),
                      }}
                    >
                      <Schedule />
                    </Box>
                    <Typography
                      variant="h6"
                      color={theme.currentPalette.primary}
                      fontWeight="600"
                    >
                      Appointments Timeline
                    </Typography>
                  </Stack>

                  <Stack spacing={2}>
                    {/* Pickup Appointment */}
                    <Alert
                      variant="outlined"
                      severity={
                        load.pickupAt && new Date(load.pickupAt) <= new Date()
                          ? "success"
                          : "info"
                      }
                      icon={<CalendarToday />}
                      sx={{
                        borderColor: alpha(theme.currentPalette.text, 0.2),
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" fontWeight="600">
                          Pickup Appointment
                        </Typography>
                        <Typography variant="body2">
                          <strong>Scheduled:</strong>{" "}
                          {load.pickupAt
                            ? new Date(load.pickupAt).toLocaleString()
                            : "Not scheduled"}
                        </Typography>
                        {load.origin && (
                          <Typography variant="body2">
                            <strong>Location:</strong> {load.origin}
                          </Typography>
                        )}
                      </Stack>
                    </Alert>

                    {/* Arrival at Shipper */}
                    {load.arrivalAtShipper && (
                      <Alert
                        variant="outlined"
                        severity="success"
                        icon={<LocationOn />}
                        sx={{
                          borderColor: alpha(theme.currentPalette.text, 0.2),
                        }}
                      >
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" fontWeight="600">
                            Arrived at Shipper
                          </Typography>
                          <Typography variant="body2">
                            <strong>Time:</strong>{" "}
                            {new Date(load.arrivalAtShipper).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Alert>
                    )}

                    {/* Left Shipper */}
                    {load.leftShipper && (
                      <Alert
                        variant="outlined"
                        severity="success"
                        icon={<LocalShipping />}
                        sx={{
                          borderColor: alpha(theme.currentPalette.text, 0.2),
                        }}
                      >
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" fontWeight="600">
                            Left Shipper
                          </Typography>
                          <Typography variant="body2">
                            <strong>Time:</strong>{" "}
                            {new Date(load.leftShipper).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Alert>
                    )}

                    {/* Arrival at Receiver */}
                    {load.arrivalAtReceiver && (
                      <Alert
                        variant="outlined"
                        severity="success"
                        icon={<LocationOn />}
                        sx={{
                          borderColor: alpha(theme.currentPalette.text, 0.2),
                        }}
                      >
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" fontWeight="600">
                            Arrived at Receiver
                          </Typography>
                          <Typography variant="body2">
                            <strong>Time:</strong>{" "}
                            {new Date(load.arrivalAtReceiver).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Alert>
                    )}

                    {/* Left Receiver */}
                    {load.leftReceiver && (
                      <Alert
                        variant="outlined"
                        severity="success"
                        icon={<LocalShipping />}
                        sx={{
                          borderColor: alpha(theme.currentPalette.text, 0.2),
                        }}
                      >
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" fontWeight="600">
                            Left Receiver
                          </Typography>
                          <Typography variant="body2">
                            <strong>Time:</strong>{" "}
                            {new Date(load.leftReceiver).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Alert>
                    )}

                    {/* Delivery Appointment */}
                    <Alert
                      variant="outlined"
                      severity={
                        load.deliveredAt
                          ? "success"
                          : load.completedAt
                            ? "info"
                            : "warning"
                      }
                      icon={<CalendarToday />}
                      sx={{
                        borderColor: alpha(theme.currentPalette.text, 0.2),
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography variant="subtitle1" fontWeight="600">
                          Delivery Appointment
                        </Typography>
                        {load.deliveredAt ? (
                          <>
                            <Typography variant="body2">
                              <strong>Delivered at:</strong>{" "}
                              {new Date(load.deliveredAt).toLocaleString()}
                            </Typography>
                            {load.destination && (
                              <Typography variant="body2">
                                <strong>Location:</strong>{" "}
                                {Array.isArray(load.destination)
                                  ? load.destination.join(", ")
                                  : load.destination}
                              </Typography>
                            )}
                          </>
                        ) : load.completedAt ? (
                          <Typography variant="body2">
                            <strong>Scheduled Completion:</strong>{" "}
                            {new Date(load.completedAt).toLocaleString()}
                          </Typography>
                        ) : (
                          <Typography variant="body2">
                            Delivery appointment not yet scheduled
                          </Typography>
                        )}
                      </Stack>
                    </Alert>

                    {/* Cancelled Appointment */}
                    {load.cancelledAt && (
                      <Alert
                        variant="outlined"
                        severity="error"
                        icon={<Schedule />}
                        sx={{
                          borderColor: alpha(theme.currentPalette.text, 0.2),
                        }}
                      >
                        <Stack spacing={1}>
                          <Typography variant="subtitle1" fontWeight="600">
                            Cancelled
                          </Typography>
                          <Typography variant="body2">
                            <strong>Cancelled at:</strong>{" "}
                            {new Date(load.cancelledAt).toLocaleString()}
                          </Typography>
                          {load.status === "cancelled" && (
                            <Typography variant="body2">
                              This load has been cancelled
                            </Typography>
                          )}
                        </Stack>
                      </Alert>
                    )}

                    {/* No Appointments Message */}
                    {!load.pickupAt &&
                      !load.completedAt &&
                      !load.deliveredAt &&
                      !load.cancelledAt &&
                      !load.arrivalAtShipper &&
                      !load.leftShipper &&
                      !load.arrivalAtReceiver &&
                      !load.leftReceiver && (
                        <Alert
                          variant="outlined"
                          severity="info"
                          sx={{
                            borderColor: alpha(theme.currentPalette.text, 0.2),
                          }}
                        >
                          <Typography variant="body2">
                            No appointments scheduled for this load yet.
                          </Typography>
                        </Alert>
                      )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* View Note Dialog */}
      <Dialog
        open={viewNoteDialog}
        onClose={handleCloseNoteDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.currentPalette.background,
            borderBottom: `1px solid ${alpha(theme.currentPalette.text, 0.1)}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant="h5"
              fontWeight="600"
              color={theme.currentPalette.primary}
            >
              Note Details
            </Typography>
            <IconButton onClick={handleCloseNoteDialog}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: theme.currentPalette.background }}>
          {selectedNote && (
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  color={theme.currentPalette.secondary}
                  gutterBottom
                >
                  Note Content
                </Typography>
                <Card
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: theme.currentPalette.background,
                    borderColor: alpha(theme.currentPalette.text, 0.2),
                  }}
                >
                  <Typography variant="body1">
                    {selectedNote.text || selectedNote.content}
                  </Typography>
                </Card>
              </Box>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    color={theme.currentPalette.secondary}
                    gutterBottom
                  >
                    Added By
                  </Typography>
                  <Typography
                    variant="body1"
                    color={theme.currentPalette.primary}
                  >
                    {selectedNote?.addedBy || "Unknown"}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    color={theme.currentPalette.secondary}
                    gutterBottom
                  >
                    Created Date
                  </Typography>
                  <Typography
                    variant="body1"
                    color={theme.currentPalette.primary}
                  >
                    {selectedNote.createdAt
                      ? new Date(selectedNote.createdAt).toLocaleString()
                      : "Unknown date"}
                  </Typography>
                </Grid>

                {selectedNote.type && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="600"
                      color={theme.currentPalette.secondary}
                      gutterBottom
                    >
                      Note Type
                    </Typography>
                    <Chip
                      label={selectedNote.type}
                      color="primary"
                      variant="outlined"
                      sx={{ borderWidth: 1.5 }}
                    />
                  </Grid>
                )}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            bgcolor: theme.currentPalette.background,
            borderTop: `1px solid ${alpha(theme.currentPalette.text, 0.1)}`,
          }}
        >
          <Button
            onClick={handleCloseNoteDialog}
            variant="contained"
            sx={{
              bgcolor: theme.currentPalette.primary,
              "&:hover": {
                bgcolor: alpha(theme.currentPalette.primary, 0.9),
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <AddNoteModal
        load={load}
        isOpen={showAddNoteModal}
        onClose={() => {
          setShowAddNoteModal(false);
          refetchLoads();
        }}
      />
      {/* Modal Components */}
      <CreateEditLoadModal
        isOpen={showCreateEditModal}
        onClose={() => {
          setShowCreateEditModal(false);
          setEditingLoad(null);
          refetchLoads();
        }}
        editingLoad={editingLoad}
      />
      <UpdateStatusModal
        load={load}
        isOpen={showUpdateStatusModal}
        onClose={() => {
          setShowUpdateStatusModal(false);
          refetchLoads();
        }}
      />
    </Box>
  );
};

export default LoadInfo;
