import ContactInfo from '../models/ContactInfo.js';
import languageService from '../services/languageService.js';

// Get contact info (public endpoint)
export const getContactInfo = async (req, res) => {
  try {
    let contactInfo = await ContactInfo.findOne({ isActive: true });
    
    // If no contact info exists, create default one
    if (!contactInfo) {
      contactInfo = await ContactInfo.create({
        id: 'contact-info',
        title: 'Contact Us',
        titleAr: 'تواصل معنا',
        links: [
          {
            id: 'email',
            type: 'email',
            label: 'Email',
            labelAr: 'البريد الإلكتروني',
            url: 'mailto:info@dirwaza.com',
            icon: 'Mail',
            hoverColor: 'hover:text-blue-600',
            ariaLabel: 'Send Email',
            ariaLabelAr: 'إرسال بريد إلكتروني'
          },
          {
            id: 'instagram',
            type: 'instagram',
            label: 'Instagram',
            labelAr: 'إنستغرام',
            url: 'https://instagram.com/dirwaza',
            icon: 'Instagram',
            hoverColor: 'hover:text-pink-600',
            hoverEffect: 'hover:rotate-12',
            ariaLabel: 'Follow on Instagram',
            ariaLabelAr: 'تابعنا على إنستغرام'
          },
          {
            id: 'whatsapp',
            type: 'whatsapp',
            label: 'WhatsApp',
            labelAr: 'واتساب',
            url: 'https://wa.me/966501234567',
            icon: 'MessageCircle',
            hoverColor: 'hover:text-green-600',
            hoverEffect: 'hover:rotate-[-12deg]',
            ariaLabel: 'Contact on WhatsApp',
            ariaLabelAr: 'تواصل عبر واتساب'
          }
        ]
      });
    }

    res.json({
      success: true,
      message: languageService.getText('contactInfo.retrieved', req.language),
      data: contactInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('contactInfo.retrieveError', req.language),
      error: error.message
    });
  }
};

// Update contact info (admin only)
export const updateContactInfo = async (req, res) => {
  try {
    const { title, titleAr, links } = req.body;

    let contactInfo = await ContactInfo.findOne();
    
    if (!contactInfo) {
      // Create new contact info if none exists
      contactInfo = new ContactInfo({
        id: 'contact-info',
        title: title || 'Contact Us',
        titleAr: titleAr || 'تواصل معنا',
        links: links || []
      });
    } else {
      // Update existing contact info
      if (title) contactInfo.title = title;
      if (titleAr) contactInfo.titleAr = titleAr;
      if (links) contactInfo.links = links;
    }

    await contactInfo.save();

    res.json({
      success: true,
      message: languageService.getText('contactInfo.updated', req.language),
      data: contactInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('contactInfo.updateError', req.language),
      error: error.message
    });
  }
};

// Add contact link
export const addContactLink = async (req, res) => {
  try {
    const { id, type, label, labelAr, url, icon, hoverColor, hoverEffect, ariaLabel, ariaLabelAr } = req.body;

    if (!id || !type || !label || !labelAr || !url || !icon || !ariaLabel || !ariaLabelAr) {
      return res.status(400).json({
        success: false,
        message: languageService.getText('validation.required', req.language, {
          field: 'id, type, label, labelAr, url, icon, ariaLabel, ariaLabelAr'
        })
      });
    }

    let contactInfo = await ContactInfo.findOne();
    if (!contactInfo) {
      contactInfo = new ContactInfo({
        id: 'contact-info',
        title: 'Contact Us',
        titleAr: 'تواصل معنا',
        links: []
      });
    }

    // Check if link with same id already exists
    const existingLinkIndex = contactInfo.links.findIndex(link => link.id === id);
    if (existingLinkIndex > -1) {
      return res.status(400).json({
        success: false,
        message: languageService.getText('contactInfo.linkExists', req.language)
      });
    }

    const newLink = {
      id,
      type,
      label,
      labelAr,
      url,
      icon,
      hoverColor: hoverColor || 'hover:text-blue-600',
      hoverEffect: hoverEffect || '',
      ariaLabel,
      ariaLabelAr
    };

    contactInfo.links.push(newLink);
    await contactInfo.save();

    res.json({
      success: true,
      message: languageService.getText('contactInfo.linkAdded', req.language),
      data: contactInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('contactInfo.linkAddError', req.language),
      error: error.message
    });
  }
};

// Update contact link
export const updateContactLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { type, label, labelAr, url, icon, hoverColor, hoverEffect, ariaLabel, ariaLabelAr } = req.body;

    const contactInfo = await ContactInfo.findOne();
    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('contactInfo.notFound', req.language)
      });
    }

    const linkIndex = contactInfo.links.findIndex(link => link.id === linkId);
    if (linkIndex === -1) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('contactInfo.linkNotFound', req.language)
      });
    }

    // Update link fields
    if (type) contactInfo.links[linkIndex].type = type;
    if (label) contactInfo.links[linkIndex].label = label;
    if (labelAr) contactInfo.links[linkIndex].labelAr = labelAr;
    if (url) contactInfo.links[linkIndex].url = url;
    if (icon) contactInfo.links[linkIndex].icon = icon;
    if (hoverColor) contactInfo.links[linkIndex].hoverColor = hoverColor;
    if (hoverEffect !== undefined) contactInfo.links[linkIndex].hoverEffect = hoverEffect;
    if (ariaLabel) contactInfo.links[linkIndex].ariaLabel = ariaLabel;
    if (ariaLabelAr) contactInfo.links[linkIndex].ariaLabelAr = ariaLabelAr;

    await contactInfo.save();

    res.json({
      success: true,
      message: languageService.getText('contactInfo.linkUpdated', req.language),
      data: contactInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('contactInfo.linkUpdateError', req.language),
      error: error.message
    });
  }
};

// Delete contact link
export const deleteContactLink = async (req, res) => {
  try {
    const { linkId } = req.params;

    const contactInfo = await ContactInfo.findOne();
    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('contactInfo.notFound', req.language)
      });
    }

    const linkIndex = contactInfo.links.findIndex(link => link.id === linkId);
    if (linkIndex === -1) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('contactInfo.linkNotFound', req.language)
      });
    }

    contactInfo.links.splice(linkIndex, 1);
    await contactInfo.save();

    res.json({
      success: true,
      message: languageService.getText('contactInfo.linkDeleted', req.language),
      data: contactInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('contactInfo.linkDeleteError', req.language),
      error: error.message
    });
  }
};

// Toggle contact info active status (admin only)
export const toggleContactInfoStatus = async (req, res) => {
  try {
    const contactInfo = await ContactInfo.findOne();
    if (!contactInfo) {
      return res.status(404).json({
        success: false,
        message: languageService.getText('contactInfo.notFound', req.language)
      });
    }

    contactInfo.isActive = !contactInfo.isActive;
    await contactInfo.save();

    res.json({
      success: true,
      message: languageService.getText('contactInfo.statusToggled', req.language),
      data: contactInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: languageService.getText('contactInfo.statusToggleError', req.language),
      error: error.message
    });
  }
};
