import React from "react";
import { Modal, Form, Input, Select, message } from "antd";

export default function AddTaskModal({ open, onClose, token, onCreated }) {
  const [form] = Form.useForm();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const handleOk = () => form.submit();

  const onFinish = async (values) => {
    try {
      const payload = {
        title: values.title,
        character: values.character?.trim() || undefined,
        forum: values.forum?.trim() || undefined,
        roleplayUrl: values.roleplayUrl?.trim() || undefined,
        partners: Array.isArray(values.partners) ? values.partners : [],
      };

      const res = await fetch(`${API_BASE}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = text;
        try {
          msg = JSON.parse(text).error || msg;
        } catch {}
        message.error(`${res.status} – ${msg}`);
        return;
      }

      const task = JSON.parse(text);
      onCreated?.(task);
      message.success("Suivi créé !");
      form.resetFields();
      onClose();
    } catch (e) {
      console.error(e);
      message.error(e.message || "Erreur lors de la création.");
    }
  };

  return (
    <Modal
      title="Ajouter un suivi"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText="Créer"
      cancelText="Annuler"
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Titre du RP"
          name="title"
          rules={[{ required: true, message: "Le titre est requis" }]}
        >
          <Input placeholder="Ex: Nuit à la taverne" />
        </Form.Item>

        <Form.Item label="Personnage" name="character">
          <Input placeholder="Nom du personnage" />
        </Form.Item>

        <Form.Item label="Forum" name="forum">
          <Input placeholder="Nom du forum" />
        </Form.Item>

        <Form.Item label="Lien du RP" name="roleplayUrl">
          <Input placeholder="https://…" />
        </Form.Item>

        <Form.Item label="Partenaires" name="partners">
          <Select
            mode="tags"
            placeholder="Ajoute des partenaires"
            tokenSeparators={[","]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
