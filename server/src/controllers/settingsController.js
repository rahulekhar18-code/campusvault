import { prisma } from '../config/db.js';

export async function getSettings(req, res) {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: 'global' }
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 'global',
          appName: 'CampusVault',
          logoUrl: '',
          themeColor: '#2563eb',
          storageRoot: 'vault',
          folderFormat: '{branch}/{semester}/{subject}/{category}'
        }
      });
    }

    return res.json(settings);
  } catch (error) {
    console.error('getSettings error:', error);
    return res.status(500).json({ error: 'Failed to fetch application settings' });
  }
}

export async function updateSettings(req, res) {
  try {
    const { appName, logoUrl, themeColor, storageRoot, folderFormat, maxFileSizeMB } = req.body;

    const dataToUpdate = {};
    if (typeof appName === 'string' && appName.trim()) dataToUpdate.appName = appName.trim();
    if (typeof logoUrl === 'string') dataToUpdate.logoUrl = logoUrl.trim();
    if (typeof themeColor === 'string' && themeColor.trim()) dataToUpdate.themeColor = themeColor.trim();
    if (typeof storageRoot === 'string' && storageRoot.trim()) dataToUpdate.storageRoot = storageRoot.trim();
    if (typeof folderFormat === 'string' && folderFormat.trim()) dataToUpdate.folderFormat = folderFormat.trim();
    if (maxFileSizeMB !== undefined && !isNaN(parseInt(maxFileSizeMB))) {
      dataToUpdate.maxFileSizeMB = Math.max(1, Math.min(100, parseInt(maxFileSizeMB)));
    }

    const updated = await prisma.appSettings.upsert({
      where: { id: 'global' },
      update: dataToUpdate,
      create: {
        id: 'global',
        appName: dataToUpdate.appName || 'CampusVault',
        logoUrl: dataToUpdate.logoUrl || '',
        themeColor: dataToUpdate.themeColor || '#2563eb',
        storageRoot: dataToUpdate.storageRoot || 'vault',
        folderFormat: dataToUpdate.folderFormat || '{branch}/{semester}/{subject}/{category}',
        maxFileSizeMB: dataToUpdate.maxFileSizeMB || 25
      }
    });

    return res.json({
      success: true,
      message: 'Application settings updated successfully',
      settings: updated
    });
  } catch (error) {
    console.error('updateSettings error:', error);
    return res.status(500).json({ error: 'Failed to update application settings' });
  }
}
