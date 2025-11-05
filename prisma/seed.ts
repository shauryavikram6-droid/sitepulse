import { PrismaClient, UserRole, TaskPriority, TaskSource, TaskStatus, Period, Channel, DPRStatus, RateSource, ProgressEstimator, TaskFollowUpStatus, NotificationStatus, SafetyChecklistStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function runSeed() {
  await prisma.$transaction(async (tx) => {
    await tx.notificationQueue.deleteMany();
    await tx.dPRAnswer.deleteMany();
    await tx.dPRPrompt.deleteMany();
    await tx.dPRQuestionBank.deleteMany();
    await tx.taskFollowUp.deleteMany();
    await tx.task.deleteMany();
    await tx.audioNote.deleteMany();
    await tx.attendanceEntry.deleteMany();
    await tx.labourPlan.deleteMany();
    await tx.wageRate.deleteMany();
    await tx.trade.deleteMany();
    await tx.progressPhoto.deleteMany();
    await tx.savingsSnapshot.deleteMany();
    await tx.benchmarkRate.deleteMany();
    await tx.invoiceLine.deleteMany();
    await tx.invoice.deleteMany();
    await tx.purchaseOrderLine.deleteMany();
    await tx.purchaseOrder.deleteMany();
    await tx.safetyPhoto.deleteMany();
    await tx.safetyChecklist.deleteMany();
    await tx.safetyTemplate.deleteMany();
    await tx.drawingDiff.deleteMany();
    await tx.drawingVersion.deleteMany();
    await tx.drawing.deleteMany();
    await tx.userAssignment.deleteMany();
    await tx.userOrgRole.deleteMany();
    await tx.site.deleteMany();
    await tx.project.deleteMany();
    await tx.user.deleteMany();
    await tx.organization.deleteMany();
  });

  const password = await bcrypt.hash('sitepulse123', 10);

  const org = await prisma.organization.create({
    data: {
      name: 'Acme Infra Builders'
    }
  });

  const [admin, pm, engineer] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Anita Admin',
        email: 'admin@demo.com',
        passwordHash: password,
        passwordAlgo: 'bcrypt',
        role: UserRole.ADMIN,
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        name: 'Peter PM',
        email: 'pm@demo.com',
        passwordHash: password,
        passwordAlgo: 'bcrypt',
        role: UserRole.PM,
        isActive: true
      }
    }),
    prisma.user.create({
      data: {
        name: 'Emily Engineer',
        email: 'engineer@demo.com',
        passwordHash: password,
        passwordAlgo: 'bcrypt',
        role: UserRole.ENGINEER,
        isActive: true
      }
    })
  ]);

  await prisma.userOrgRole.createMany({
    data: [
      { userId: admin.id, orgId: org.id, role: UserRole.ADMIN },
      { userId: pm.id, orgId: org.id, role: UserRole.PM },
      { userId: engineer.id, orgId: org.id, role: UserRole.ENGINEER }
    ]
  });

  const project = await prisma.project.create({
    data: {
      name: 'Downtown Tower',
      code: 'DT-01',
      location: 'Mumbai',
      orgId: org.id
    }
  });

  const site = await prisma.site.create({
    data: {
      name: 'Tower Site A',
      projectId: project.id,
      orgId: org.id
    }
  });

  await prisma.userAssignment.createMany({
    data: [
      { userId: pm.id, projectId: project.id, role: UserRole.PM },
      { userId: engineer.id, siteId: site.id, role: UserRole.ENGINEER }
    ]
  });

  const masonry = await prisma.trade.create({
    data: {
      name: 'Masonry',
      orgId: org.id
    }
  });

  const carpentry = await prisma.trade.create({
    data: {
      name: 'Carpentry',
      orgId: org.id
    }
  });

  const masonryRate = await prisma.wageRate.create({
    data: {
      tradeId: masonry.id,
      ratePerDay: 700,
      currency: 'INR',
      effectiveFrom: new Date('2024-01-01T00:00:00.000Z')
    }
  });

  await prisma.wageRate.create({
    data: {
      tradeId: carpentry.id,
      ratePerDay: 650,
      currency: 'INR',
      effectiveFrom: new Date('2024-01-01T00:00:00.000Z')
    }
  });

  await prisma.labourPlan.createMany({
    data: [
      {
        siteId: site.id,
        weekStart: new Date('2024-01-01T00:00:00.000Z'),
        plannedCost: 20000,
        currency: 'INR',
        notes: 'Baseline week'
      },
      {
        siteId: site.id,
        weekStart: new Date('2024-01-08T00:00:00.000Z'),
        plannedCost: 21000,
        currency: 'INR',
        notes: 'Structural ramp-up'
      }
    ]
  });

  const attendanceDates = [
    new Date('2024-01-02T00:00:00.000Z'),
    new Date('2024-01-03T00:00:00.000Z'),
    new Date('2024-01-04T00:00:00.000Z')
  ];

  for (const date of attendanceDates) {
    await prisma.attendanceEntry.create({
      data: {
        siteId: site.id,
        date,
        tradeId: masonry.id,
        headcount: 10,
        rateSnapshot: masonryRate.ratePerDay,
        rateSource: RateSource.TABLE,
        total: masonryRate.ratePerDay.mul(10),
        wageRateId: masonryRate.id
      }
    });
  }

  const audioNote = await prisma.audioNote.create({
    data: {
      siteId: site.id,
      uploadedById: engineer.id,
      filePath: '/uploads/audio/site-a-note-1.mp3',
      storageProvider: 'local',
      mediaType: 'audio/mpeg',
      durationSec: 42,
      transcribedText: 'Check scaffold bracing and follow up with vendor.',
      transcribedAt: new Date(),
      transcriptionProvider: 'stub-transcriber'
    }
  });

  const task = await prisma.task.create({
    data: {
      siteId: site.id,
      title: 'Scaffold bracing check',
      description: 'Ensure all scaffold braces are tightened before evening shift.',
      assigneeId: engineer.id,
      dueDate: new Date('2024-01-05T00:00:00.000Z'),
      status: TaskStatus.OPEN,
      source: TaskSource.VOICE,
      priority: TaskPriority.HIGH,
      createdById: pm.id,
      audioNoteId: audioNote.id
    }
  });

  await prisma.taskFollowUp.create({
    data: {
      taskId: task.id,
      status: TaskFollowUpStatus.SENT,
      retries: 0
    }
  });

  await prisma.purchaseOrder.create({
    data: {
      siteId: site.id,
      vendor: 'ABC Supplies',
      amount: 120000,
      currency: 'INR',
      estimateRef: 'EST-PO-01',
      lines: {
        create: [
          { itemCode: 'STEEL-ROD', qty: 15, rate: 5000 },
          { itemCode: 'FORMWORK', qty: 5, rate: 8000 }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      siteId: site.id,
      vendor: 'ABC Supplies',
      amount: 110000,
      currency: 'INR',
      discount: 5000,
      estimateRef: 'EST-PO-01',
      date: new Date('2024-01-10T00:00:00.000Z'),
      lines: {
        create: [
          { itemCode: 'STEEL-ROD', qty: 15, rate: 4700 },
          { itemCode: 'FORMWORK', qty: 5, rate: 7800 }
        ]
      }
    }
  });

  await prisma.benchmarkRate.create({
    data: {
      siteId: site.id,
      itemCode: 'STEEL-ROD',
      rate: 5200,
      currency: 'INR',
      effectiveFrom: new Date('2023-12-01T00:00:00.000Z')
    }
  });

  await prisma.savingsSnapshot.create({
    data: {
      siteId: site.id,
      period: Period.WEEK,
      periodStart: new Date('2024-01-01T00:00:00.000Z'),
      periodEnd: new Date('2024-01-07T00:00:00.000Z'),
      estimated: 200000,
      actual: 180000,
      saved: 20000,
      methodVersion: 'v1-basic-diff'
    }
  });

  await prisma.progressPhoto.create({
    data: {
      siteId: site.id,
      date: new Date('2024-01-04T00:00:00.000Z'),
      filePath: '/uploads/progress/progress-1.jpg',
      storageProvider: 'local',
      mimeType: 'image/jpeg',
      checksum: 'demo-checksum-1',
      aiLabel: 'Slab Pour',
      percentComplete: 45,
      estimator: ProgressEstimator.AI,
      estimatorVersion: 'stub-v1',
      takenAt: new Date('2024-01-04T08:00:00.000Z'),
      uploaderId: engineer.id
    }
  });

  const drawing = await prisma.drawing.create({
    data: {
      siteId: site.id,
      discipline: 'ARCH',
      title: 'Level 10 Layout'
    }
  });

  const baseVersion = await prisma.drawingVersion.create({
    data: {
      drawingId: drawing.id,
      versionNo: 1,
      filePath: '/uploads/drawings/level-10-v1.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1200000,
      checksum: 'checksum-v1',
      storageProvider: 'local',
      uploadedById: pm.id
    }
  });

  const newVersion = await prisma.drawingVersion.create({
    data: {
      drawingId: drawing.id,
      versionNo: 2,
      filePath: '/uploads/drawings/level-10-v2.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1210000,
      checksum: 'checksum-v2',
      storageProvider: 'local',
      uploadedById: pm.id
    }
  });

  await prisma.drawingDiff.create({
    data: {
      oldVersionId: baseVersion.id,
      newVersionId: newVersion.id,
      diffSummaryText: 'Adjusted core wall thickness.'
    }
  });

  const template = await prisma.safetyTemplate.create({
    data: {
      orgId: org.id,
      name: 'Daily Safety Walk',
      itemsJson: {
        items: [
          'Check harness usage',
          'Inspect scaffolding',
          'Verify PPE compliance'
        ]
      }
    }
  });

  const checklist = await prisma.safetyChecklist.create({
    data: {
      templateId: template.id,
      siteId: site.id,
      date: new Date('2024-01-04T00:00:00.000Z'),
      completedById: engineer.id,
      completedAt: new Date('2024-01-04T10:00:00.000Z'),
      status: SafetyChecklistStatus.COMPLETED,
      notes: 'All safe'
    }
  });

  await prisma.safetyPhoto.create({
    data: {
      checklistId: checklist.id,
      filePath: '/uploads/safety/photo-1.jpg',
      storageProvider: 'local',
      mimeType: 'image/jpeg',
      checksum: 'safety-checksum-1',
      caption: 'Guardrails in place',
      takenAt: new Date('2024-01-04T09:30:00.000Z'),
      uploadedById: engineer.id
    }
  });

  const question = await prisma.dPRQuestionBank.create({
    data: {
      questionKey: 'progress_summary',
      promptText: 'Summarize today\'s progress',
      unit: null
    }
  });

  const prompt = await prisma.dPRPrompt.create({
    data: {
      siteId: site.id,
      date: new Date('2024-01-04T00:00:00.000Z'),
      status: DPRStatus.ANSWERED
    }
  });

  await prisma.dPRAnswer.create({
    data: {
      promptId: prompt.id,
      questionId: question.id,
      answerText: 'Completed slab reinforcement for zone B.',
      numericValue: null
    }
  });

  await prisma.notificationQueue.create({
    data: {
      siteId: site.id,
      userId: engineer.id,
      channel: Channel.CONSOLE,
      templateKey: 'task-reminder',
      payloadJson: { taskId: task.id, message: 'Reminder: Scaffold bracing check pending.' },
      status: NotificationStatus.QUEUED,
      scheduledAt: new Date()
    }
  });
  
  console.log('Seed data created successfully.');
}

if (require.main === module) {
  runSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
