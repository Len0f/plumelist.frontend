import React, { useState } from "react";
import { Form, Input, Select, message } from "antd";
import UiModal from "./UiModal";

/**
 * AddTaskModal : création d’un suivi.
 */
export default function AddTaskModal({ open, onClose, token, onCreated }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401)
          message.error("Session expirée. Merci de vous reconnecter.");
        else message.error(`${res.status} – ${data.error || "Erreur serveur"}`);
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
