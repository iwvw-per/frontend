import { Box, debounce, useTheme } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getShareList } from "../../../api/api.ts";
import { Share } from "../../../api/dashboard.ts";
import { useAppDispatch } from "../../../redux/hooks.ts";
import { DenseAutocomplete, DenseFilledTextField, SquareChip } from "../../Common/StyledComponents.tsx";
import LinkDismiss from "../../Icons/LinkDismiss.tsx";

export interface SharesInputProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
}

const SharesInput = ({ value, onChange, disabled }: SharesInputProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [options, setOptions] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);
  const keywordRef = useRef("");

  const loadShares = useMemo(
    () =>
      debounce((keyword: string) => {
        keywordRef.current = keyword;
        setLoading(true);
        dispatch(
          getShareList({
            page_size: 50,
            page: 1,
            order_by: "id",
            order_direction: "desc",
            searches: keyword
              ? {
                  share_link: keyword,
                }
              : undefined,
          }),
        )
          .then((res) => {
            setOptions(res.shares ?? []);
          })
          .catch(() => {})
          .finally(() => {
            setLoading(false);
          });
      }, 300),
    [dispatch],
  );

  useEffect(() => {
    loadShares("");
    return () => {
      loadShares.clear();
    };
  }, [loadShares]);

  const selectedShares = useMemo(() => {
    if (!value || value.length === 0) {
      return [];
    }
    return value
      .map((idStr) => options.find((s) => s.id === parseInt(idStr)))
      .filter((s): s is Share => s !== undefined);
  }, [value, options]);

  return (
    <DenseAutocomplete
      multiple
      loading={loading}
      disabled={disabled}
      options={options}
      value={selectedShares}
      isOptionEqualToValue={(option: any, val: any) => option.id === val.id}
      getOptionLabel={(option: any) => option.share_link ?? `#${option.id}`}
      blurOnSelect
      filterSelectedOptions
      onInputChange={(_e, val: any) => {
        loadShares(String(val ?? ""));
      }}
      onChange={(_e, val: any) => {
        onChange?.(val.map((s: any) => String(s.id)));
      }}
      renderInput={(params) => (
        <DenseFilledTextField
          {...params}
          sx={{
            "& .MuiInputBase-root": {},
            "& .MuiInputBase-root.MuiOutlinedInput-root": {
              paddingTop: theme.spacing(0.6),
              paddingBottom: theme.spacing(0.6),
            },
            mt: 0,
          }}
          variant="outlined"
          margin="dense"
          placeholder={t("dashboard:settings.searchShare")}
          type="text"
          fullWidth
        />
      )}
      renderTags={(tagValue: any, getTagProps) =>
        tagValue.map((option: any, index: number) => (
          <SquareChip
            size={"small"}
            label={option.share_link ?? `#${option.id}`}
            {...getTagProps({ index })}
            deleteIcon={<LinkDismiss />}
          />
        ))
      }
    />
  );
};

export default SharesInput;
