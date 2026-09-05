import { Alert, Button, Checkbox, Chip, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { StoragePolicy } from "../../../../../api/dashboard";
import { PolicyType } from "../../../../../api/explorer";
import { listPoliciesForLoadBalance } from "../../../../../api/proLoadBalance";
import { useAppDispatch } from "../../../../../redux/hooks";
import FacebookCircularProgress from "../../../../Common/CircularProgress";
import { DenseFilledTextField } from "../../../../Common/StyledComponents";
import SettingForm from "../../../../Pages/Setting/SettingForm";
import { NoMarginHelperText, SettingSection, SettingSectionContent } from "../../../Settings/Settings";
import { AddWizardProps } from "../../AddWizardDialog";

const defaultWeight = 1;

const LoadBalanceWizard = ({ onSubmit }: AddWizardProps) => {
  const { t } = useTranslation("dashboard");
  const dispatch = useAppDispatch();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [policies, setPolicies] = useState<StoragePolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [weights, setWeights] = useState<Record<number, number>>({});

  const selectedPolicies = useMemo(() => {
    return policies.filter((p) => selectedIds.includes(p.id));
  }, [policies, selectedIds]);

  const fetchPolicies = useCallback(() => {
    setLoading(true);
    dispatch(listPoliciesForLoadBalance())
      .then((res) => setPolicies(res))
      .finally(() => setLoading(false));
  }, [dispatch]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const onSelectPolicy = useCallback((policy: StoragePolicy, checked: boolean) => {
    if (checked) {
      setSelectedIds((ids) => [...ids, policy.id]);
      setWeights((w) => ({ ...w, [policy.id]: defaultWeight }));
    } else {
      setSelectedIds((ids) => ids.filter((id) => id !== policy.id));
      setWeights((w) => {
        const next = { ...w };
        delete next[policy.id];
        return next;
      });
    }
  }, []);

  const onWeightChange = useCallback((policyId: number, value: string) => {
    const parsed = parseInt(value);
    setWeights((w) => ({ ...w, [policyId]: isNaN(parsed) || parsed < 0 ? 0 : parsed }));
  }, []);

  const handleSubmit = () => {
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
    if (selectedPolicies.length === 0) {
      return;
    }

    const weightMap: Record<string, number> = {};
    for (const p of selectedPolicies) {
      const w = weights[p.id] ?? defaultWeight;
      if (w > 0) {
        weightMap[String(p.id)] = w;
      }
    }

    onSubmit({
      id: 0,
      name,
      type: PolicyType.load_balance,
      dir_name_rule: "{uid}/{path}",
      file_name_rule: "{uuid}_{originname}",
      settings: {
        load_balancer: {
          weights: weightMap,
        },
      },
      edges: {},
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <SettingForm title={t("policy.name")} lgWidth={12}>
        <DenseFilledTextField fullWidth required value={name} onChange={(e) => setName(e.target.value)} />
        <NoMarginHelperText>{t("policy.policyName")}</NoMarginHelperText>
      </SettingForm>
      <SettingSection sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t("policy.childPolicy")}
        </Typography>
        <SettingSectionContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("policy.loadBalanceDes")}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t("policy.selectPoliciesDes")}
          </Typography>
          {loading && policies.length === 0 && <FacebookCircularProgress />}
          {policies.map((p) => {
            const selected = selectedIds.includes(p.id);
            return (
              <Stack key={p.id} direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
                <Checkbox checked={selected} onChange={(e) => onSelectPolicy(p, e.target.checked)} />
                <Chip label={p.name} size="small" />
                {selected && (
                  <TextField
                    size="small"
                    type="number"
                    label={t("policy.weight")}
                    slotProps={{
                      htmlInput: { min: 0 },
                    }}
                    value={weights[p.id] ?? defaultWeight}
                    onChange={(e) => onWeightChange(p.id, e.target.value)}
                    sx={{ width: 120 }}
                  />
                )}
              </Stack>
            );
          })}
          {!loading && policies.length === 0 && <Alert severity="warning">{t("policy.childPolicyDes")}</Alert>}
          <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {t("policy.xChildPolicies", { count: selectedPolicies.length })}
            </Typography>
          </Stack>
        </SettingSectionContent>
      </SettingSection>
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
        disabled={name === "" || selectedPolicies.length === 0}
        onClick={handleSubmit}
      >
        {t("policy.create")}
      </Button>
    </form>
  );
};

export default LoadBalanceWizard;
