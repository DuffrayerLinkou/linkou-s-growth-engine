-- Update WhatsApp number to the new primary contact number
UPDATE landing_settings 
SET whatsapp_number = '5541988988054',
    updated_at = now()
WHERE id = 'bb25a923-c206-4c7a-be6c-5a6962a35332';