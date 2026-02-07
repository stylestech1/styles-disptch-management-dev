"use client";
import { RootState, useAppSelector } from "@/redux/store";
import { alpha, Box, Button, TextField, Typography } from "@mui/material";
import { useState, useEffect, useRef } from "react";

export type TPlace = {
  display_name: string;
  secondary_text?: string;
  lat: string;
  lon: string;
  place_id: string;
  postcode?: string;
  city?: string;
  state?: string;
  address?: {
    [key: string]: string;
  };
};

interface Props {
  label?: string;
  value: TPlace | null;
  setValue: (place: TPlace | null) => void;
  placeholder?: string;
  showZipCode?: boolean;
  required?: boolean;
  startAdornment?: React.ReactNode;
}

const LocationAutocomplete = ({
  label,
  value,
  setValue,
  placeholder,
  required,
  startAdornment,
  showZipCode = true,
}: Props) => {
  const [input, setInput] = useState(value?.display_name || "");
  const [suggestions, setSuggestions] = useState<TPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [shouldSearch, setShouldSearch] = useState(true);
  const theme = useAppSelector((state: RootState) => state.palette);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(
    null
  );
  const userTypedRef = useRef(false);

  // Initialize Google Places API
  useEffect(() => {
    const initGooglePlaces = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          if (
            window.google &&
            window.google.maps &&
            window.google.maps.places
          ) {
            autocompleteRef.current =
              new google.maps.places.AutocompleteService();
          }
        };

        document.head.appendChild(script);
      } else {
        autocompleteRef.current = new google.maps.places.AutocompleteService();
      }
    };

    initGooglePlaces();
  }, []);

  useEffect(() => {
    if (value?.display_name) {
      userTypedRef.current = false;
      setInput(value.display_name);
    }
  }, [value]);

  useEffect(() => {
    if (
      !userTypedRef.current ||
      isSelecting ||
      !shouldSearch ||
      input.length < 2 ||
      !autocompleteRef.current
    ) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const requestTypes = [{ types: ["establishment", "geocode"] }];

        let allPredictions: google.maps.places.AutocompletePrediction[] = [];

        for (const requestConfig of requestTypes) {
          try {
            const request: google.maps.places.AutocompletionRequest = {
              input,
              componentRestrictions: { country: "us" },
              ...requestConfig,
            };

            await new Promise<void>((resolve) => {
              autocompleteRef.current!.getPlacePredictions(
                request,
                (predictions, status) => {
                  if (
                    status === google.maps.places.PlacesServiceStatus.OK &&
                    predictions
                  ) {
                    allPredictions = [...allPredictions, ...predictions];
                  }
                  resolve();
                }
              );
            });

            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            console.log(
              `Request type ${requestConfig.types} failed, trying next...`
            );
          }
        }

        const uniquePredictions = allPredictions
          .filter(
            (prediction, index, self) =>
              index ===
              self.findIndex((p) => p.place_id === prediction.place_id)
          )
          .slice(0, 10);

        if (uniquePredictions.length > 0) {
          const formattedPredictions = uniquePredictions.map((prediction) => ({
            place_id: prediction.place_id,
            display_name: prediction.description,
            secondary_text: prediction.structured_formatting.secondary_text,
            lat: "",
            lon: "",
            postcode: undefined,
            city: "",
            state: "",
            address: {},
          }));

          setSuggestions(formattedPredictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(true);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching places:", err);
        setShowSuggestions(false);
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [input, isSelecting, shouldSearch]);

  const getGeocodedAddress = async (
    placeId: string
  ): Promise<TPlace | null> => {
    if (placeId.startsWith("temp_") || placeId.startsWith("geocoded_")) {
      return null;
    }

    return new Promise((resolve) => {
      if (!window.google || !window.google.maps) {
        resolve(null);
        return;
      }

      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ placeId }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const result = results[0];

          let postcode = "";
          let city = "";
          let state = "";
          const formattedAddress = result.formatted_address || "";

          result.address_components?.forEach((component) => {
            const types = component.types;

            if (types.includes("postal_code")) {
              postcode = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              state = component.short_name;
            } else if (types.includes("locality")) {
              city = component.long_name;
            } else if (types.includes("postal_town") && !city) {
              city = component.long_name;
            } else if (
              (types.includes("sublocality") ||
                types.includes("neighborhood")) &&
              !city
            ) {
              city = component.long_name;
            } else if (types.includes("administrative_area_level_2") && !city) {
              city = component.long_name;
            }
          });

          if (!city && formattedAddress) {
            const parts = formattedAddress.split(",");
            if (parts.length > 0) {
              city = parts[0].trim();
            }
          }

          // let displayName = "";
          // if (city && state && postcode) {
          //   displayName = `${city.toUpperCase()} ${state} ${postcode}`;
          // } else if (city && state) {
          //   displayName = `${city.toUpperCase()} ${state}`;
          // } else if (city && postcode) {
          //   displayName = `${city.toUpperCase()} ${postcode}`;
          // } else if (state && postcode) {
          //   displayName = `${state} ${postcode}`;
          // } else if (formattedAddress) {
          //   displayName = formattedAddress;
          // } else if (result.types && result.types.includes("postal_code")) {
          //   displayName = postcode;
          // }

          const finalPlace: TPlace = {
            place_id: placeId,
            lat: result.geometry?.location?.lat().toString() || "",
            lon: result.geometry?.location?.lng().toString() || "",
            display_name: result.formatted_address,
            postcode: postcode || undefined,
            city,
            state,
            address: {},
          };

          result.address_components?.forEach((component) => {
            component.types.forEach((type) => {
              if (!finalPlace.address![type]) {
                finalPlace.address![type] = component.long_name;
              }
            });
          });

          resolve(finalPlace);
        } else {
          console.error("Geocoding error:", status);
          resolve(null);
        }
      });
    });
  };

  const getPlaceDetails = async (placeId: string): Promise<TPlace | null> => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        resolve(null);
        return;
      }

      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: [
          "formatted_address",
          "geometry",
          "place_id",
          "address_components",
          "name",
          "types",
        ],
      };

      service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          let displayName = place.formatted_address || place.name || "";
          let postcode = "";
          let city = "";
          let state = "";

          place.address_components?.forEach((component) => {
            const types = component.types;

            if (types.includes("postal_code")) {
              postcode = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              state = component.short_name;
            } else if (types.includes("locality")) {
              city = component.long_name;
            }
          });

          if (city && state && postcode) {
            displayName = `${city} ${state} ${postcode}`;
          }

          const result: TPlace = {
            place_id: place.place_id!,
            lat: place.geometry?.location?.lat().toString() || "",
            lon: place.geometry?.location?.lng().toString() || "",
            display_name: displayName,
            postcode: postcode || undefined,
            city,
            state,
            address: {},
          };

          place.address_components?.forEach((component) => {
            component.types.forEach((type) => {
              if (!result.address![type]) {
                result.address![type] = component.long_name;
              }
            });
          });

          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const clearValue = () => {
    setValue(null);
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSelecting(false);
    setShouldSearch(true);
  };

  const handleSelectPlace = async (place: TPlace) => {
    userTypedRef.current = false;
    setIsSelecting(true);
    setShouldSearch(false);

    try {
      let placeDetails = await getGeocodedAddress(place.place_id);

      if (!placeDetails) {
        placeDetails = await getPlaceDetails(place.place_id);
      }

      if (placeDetails) {
        console.log("Setting place details:", placeDetails);
        setValue(placeDetails);
        setInput(placeDetails.display_name);
      } else {
        console.log("Using basic place info:", place);
        setValue(place);
        setInput(place.display_name);
      }
    } catch (error) {
      console.error("Error selecting place:", error);
      setValue(place);
      setInput(place.display_name);
    }

    setSuggestions([]);
    setShowSuggestions(false);

    if (inputRef.current) {
      inputRef.current.focus();
    }

    setTimeout(() => {
      setIsSelecting(false);
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);
    // setIsSelecting(true);
    setShouldSearch(true);
    userTypedRef.current = true;

    if (newValue === "" && value) {
      setValue(null);
    }

    if (newValue.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && input.length >= 2 && !isSelecting) {
      setShowSuggestions(true);
    } else if (input.length >= 2 && shouldSearch) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      if (!isSelecting) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" || e.key === "Tab") {
      setShowSuggestions(false);
    }
  };

  const formatSuggestionDisplay = (place: TPlace) => {
    return place.display_name;
  };

  const handleDirectZipSearch = async () => {
    if (input.trim().length >= 5 && /^\d{5}(-\d{4})?$/.test(input.trim())) {
      setLoading(true);
      try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { address: input.trim(), componentRestrictions: { country: "us" } },
          (results, status) => {
            if (
              status === google.maps.GeocoderStatus.OK &&
              results &&
              results[0]
            ) {
              const result = results[0];

              const postcode = input.trim();
              let city = "";
              let state = "";

              result.address_components?.forEach((component) => {
                const types = component.types;

                if (types.includes("administrative_area_level_1")) {
                  state = component.short_name;
                } else if (types.includes("locality")) {
                  city = component.long_name;
                } else if (types.includes("postal_town") && !city) {
                  city = component.long_name;
                }
              });

              const displayName =
                city && state
                  ? `${city.toUpperCase()} ${state} ${postcode}`
                  : `${postcode}`;

              const place: TPlace = {
                place_id: result.place_id || `zip_${postcode}`,
                lat: result.geometry?.location?.lat().toString() || "",
                lon: result.geometry?.location?.lng().toString() || "",
                display_name: displayName,
                postcode,
                city,
                state,
                address: {},
              };

              setValue(place);
              setInput(displayName);
            }
            setLoading(false);
          }
        );
      } catch (error) {
        console.error("Error in direct zip search:", error);
        setLoading(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <Typography
        sx={{
          color: theme.currentPalette.primary,
          fontSize: "16px",
          fontWeight: "bold",
          display: "block",
          mb: 1,
        }}
      >
        {label} <span className="text-red-500">{required ? "*" : ""}</span>
      </Typography>
      <div className="flex items-end gap-5">
        <div className="relative flex items-end gap-4 w-full">
          <TextField
            inputRef={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder={
              placeholder ||
              "Enter city, state and ZIP (e.g., ABINGDON VA 24210)"
            }
            variant="outlined"
            fullWidth
            size="small"
            sx={{
              bgcolor: theme.currentPalette.background,
            }}
            slotProps={{
              input: {
                endAdornment: input && (
                  <Button
                    onClick={clearValue}
                    type="button"
                    variant="text"
                    size="small"
                    sx={{
                      minWidth: 0,
                      padding: 0.5,
                      color: "red",
                    }}
                  >
                    ✕
                  </Button>
                ),
              },
            }}
          />
        </div>
      </div>

      {loading && (
        <Box
          sx={{ bgcolor: theme.currentPalette.background }}
          className="absolute top-17 left-0 border p-2 w-full z-50 shadow-lg rounded-b"
        >
          <div className="flex items-center justify-center">
            <Box
              className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2"
              sx={{ borderColor: theme.currentPalette.primary }}
            ></Box>
            <Typography sx={{ color: theme.currentPalette.primary }}>
              Searching...
            </Typography>
          </div>
        </Box>
      )}

      {!loading && showSuggestions && suggestions.length > 0 && (
        <Box
          component={"ul"}
          sx={{ bgcolor: theme.currentPalette.background }}
          className="absolute top-17 left-0 border w-full max-h-60 overflow-auto z-50 shadow-lg rounded-b"
        >
          {suggestions.map((s) => (
            <Box
              component={"li"}
              sx={{
                "&:hover": {
                  bgcolor: alpha(theme.currentPalette.primary, 0.1),
                },
              }}
              key={s.place_id}
              className="p-3 cursor-pointer border-b last:border-b-0 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectPlace(s);
              }}
            >
              <div className="text-sm font-medium text-gray-800">
                {formatSuggestionDisplay(s)}
              </div>
              {showZipCode && s.postcode && (
                <div className="text-xs text-green-600 mt-1 font-semibold">
                  📮 ZIP: {s.postcode}
                </div>
              )}
            </Box>
          ))}
        </Box>
      )}

      {!loading &&
        showSuggestions &&
        suggestions.length === 0 &&
        input.length >= 2 && (
          <Box
            sx={{ bgcolor: theme.currentPalette.background }}
            className="absolute top-17 left-0 border p-2 w-full z-50 shadow-lg rounded-b"
          >
            <Typography sx={{ color: theme.currentPalette.primary }}>
              No locations found. Try a different search term.
            </Typography>
          </Box>
        )}
    </div>
  );
};

export default LocationAutocomplete;
