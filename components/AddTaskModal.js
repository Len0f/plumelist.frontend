import React, { useState } from "react";
import { Form, Input, Select, DatePicker, message } from "antd";
import dayjs from "dayjs"; // ✅ une seule import
import UiModal from "./UiModal";

/**
 * AddTaskModal : création d’un suivi (avec date de création optionnelle).
 * - Si l’utilisateur choisit une date, on envoie "YYYY-MM-DD" (sans heure).
 * - Le backend normalise et refuse les dates futures.
 */
export default function AddTaskModal({ open, onClose, token, onCreated }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const sanitizePartners = (arr) =>
    Array.from(
      new Set(
        (Array.isArray(arr) ? arr : [])
          .map((s) => (typeof s === "string" ? s.trim() : ""))
          .filter(Boolean)
      )
    );

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        title: values.title.trim(),
        character: values.character?.trim() || undefined,
        forum: values.forum?.trim() || undefined,
        roleplayUrl: values.roleplayUrl?.trim() || undefined,
        partners: sanitizePartners(values.partners),
      };

      // Date de création optionnelle — format YYYY-MM-DD (sans heure)
      if (values.createdAt) {
        payload.createdAt = values.createdAt.format("YYYY-MM-DD");
      }

      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(payload),
      });
      console.log("API_BASE =", API_BASE);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          message.error("Session expirée. Merci de vous reconnecter.");
        } else {
          message.error(`${res.status} – ${data.error || "Erreur serveur"}`);
        }
        return;
      }

      const task = await res.json();
      onCreated?.(task);
      message.success("Suivi créé !");
      form.resetFields();
      onClose();
    } catch (e) {
      console.error(e);
      message.error(e.message || "Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeAndReset = () => {
    form.resetFields();
    onClose();
  };

  return (
    <UiModal
      open={open}
      onClose={closeAndReset}
      title="Ajouter un suivi"
      primary={{
        label: "Créer",
        onClick: () => form.submit(),
        disabled: submitting,
        loading: submitting,
      }}
      secondary={{
        label: "Annuler",
        onClick: closeAndReset,
        disabled: submitting,
      }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Titre du RP"
          name="title"
          rules={[
            { required: true, message: "Le titre est requis" },
            { min: 2, message: "Le titre est trop court" },
          ]}
        >
          <Input placeholder="Ex: Nuit à la taverne" autoFocus />
        </Form.Item>

        <Form.Item label="Personnage" name="character">
          <Input placeholder="Nom du personnage" />
        </Form.Item>

        <Form.Item label="Forum" name="forum">
          <Input placeholder="Nom du forum" />
        </Form.Item>

        <Form.Item
          label="Lien du RP"
          name="roleplayUrl"
          rules={[
            () => ({
              validator(_, value) {
                if (!value || String(value).trim() === "")
                  return Promise.resolve();
                try {
                  const u = new URL(value);
                  if (!/^https?:$/.test(u.protocol)) {
                    return Promise.reject(
                      new Error(
                        "Le lien doit commencer par http:// ou https://"
                      )
                    );
                  }
                  return Promise.resolve();
                } catch {
                  return Promise.reject(new Error("Lien invalide"));
                }
              },
            }),
          ]}
        >
          <Input placeholder="https://…" inputMode="url" />
        </Form.Item>

        {/* --- Date de création (optionnelle) --- */}
        <Form.Item label="Date de création (optionnel)" name="createdAt">
          <DatePicker
            style={{ width: "100%" }}
            placeholder="Choisir une date…"
            allowClear
            disabledDate={(current) =>
              current && current > dayjs().endOf("day")
            }
          />
        </Form.Item>

        <Form.Item label="Partenaires" name="partners">
          <Select
            mode="tags"
            placeholder="Ajoute des partenaires"
            tokenSeparators={[","]}
            onChange={(vals) => {
              const sanitized = sanitizePartners(vals);
              if (sanitized.length !== (vals || []).length) {
                form.setFieldsValue({ partners: sanitized });
              }
            }}
            open={false}
          />
        </Form.Item>
      </Form>
    </UiModal>
  );
}
