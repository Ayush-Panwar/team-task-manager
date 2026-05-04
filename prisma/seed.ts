import { PrismaClient, Role, TaskStatus, TaskPriority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 12);

  // Create users
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
    },
  });

  const member = await prisma.user.create({
    data: {
      name: "Jane Member",
      email: "member@example.com",
      password: hashedPassword,
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: "Bob Developer",
      email: "bob@example.com",
      password: hashedPassword,
    },
  });

  // Create projects
  const websiteProject = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Complete overhaul of the company website with modern design and improved UX",
      members: {
        create: [
          { userId: admin.id, role: Role.ADMIN },
          { userId: member.id, role: Role.MEMBER },
          { userId: user3.id, role: Role.MEMBER },
        ],
      },
    },
  });

  const mobileProject = await prisma.project.create({
    data: {
      name: "Mobile App v2",
      description: "Second iteration of our mobile application with new features",
      members: {
        create: [
          { userId: admin.id, role: Role.ADMIN },
          { userId: member.id, role: Role.MEMBER },
        ],
      },
    },
  });

  const apiProject = await prisma.project.create({
    data: {
      name: "API Integration",
      description: "Third-party API integrations for payment and analytics",
      members: {
        create: [
          { userId: member.id, role: Role.ADMIN },
          { userId: admin.id, role: Role.MEMBER },
          { userId: user3.id, role: Role.MEMBER },
        ],
      },
    },
  });

  // Create tasks for Website Redesign
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const daysFromNow = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.task.createMany({
    data: [
      {
        title: "Design new homepage mockup",
        description: "Create wireframes and high-fidelity mockups for the new homepage",
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        projectId: websiteProject.id,
        creatorId: admin.id,
        assigneeId: member.id,
        dueDate: daysAgo(2),
      },
      {
        title: "Implement responsive navigation",
        description: "Build mobile-first navigation with hamburger menu",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        projectId: websiteProject.id,
        creatorId: admin.id,
        assigneeId: user3.id,
        dueDate: daysFromNow(3),
      },
      {
        title: "Set up CI/CD pipeline",
        description: "Configure GitHub Actions for automated testing and deployment",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        projectId: websiteProject.id,
        creatorId: admin.id,
        assigneeId: admin.id,
        dueDate: daysFromNow(7),
      },
      {
        title: "Optimize images and assets",
        description: "Compress all images, set up lazy loading, and configure CDN",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        projectId: websiteProject.id,
        creatorId: member.id,
        assigneeId: null,
        dueDate: daysFromNow(14),
      },
      {
        title: "Write unit tests for components",
        description: "Achieve 80% coverage on all shared components",
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.MEDIUM,
        projectId: websiteProject.id,
        creatorId: admin.id,
        assigneeId: member.id,
        dueDate: daysFromNow(1),
      },
      {
        title: "Fix footer layout on tablet",
        description: "Footer columns overlap on iPad viewport",
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        projectId: websiteProject.id,
        creatorId: user3.id,
        assigneeId: user3.id,
        dueDate: daysAgo(1), // overdue
      },
    ],
  });

  // Create tasks for Mobile App
  await prisma.task.createMany({
    data: [
      {
        title: "Implement push notifications",
        description: "Set up Firebase Cloud Messaging for push notifications",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        projectId: mobileProject.id,
        creatorId: admin.id,
        assigneeId: member.id,
        dueDate: daysFromNow(5),
      },
      {
        title: "Add offline mode support",
        description: "Cache critical data locally for offline access",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        projectId: mobileProject.id,
        creatorId: admin.id,
        assigneeId: admin.id,
        dueDate: daysFromNow(10),
      },
      {
        title: "Fix login crash on Android 12",
        description: "App crashes on splash screen for Android 12 devices",
        status: TaskStatus.TODO,
        priority: TaskPriority.URGENT,
        projectId: mobileProject.id,
        creatorId: member.id,
        assigneeId: admin.id,
        dueDate: daysAgo(3), // overdue
      },
      {
        title: "Design onboarding flow",
        description: "3-step onboarding for new users with illustrations",
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        projectId: mobileProject.id,
        creatorId: admin.id,
        assigneeId: member.id,
        dueDate: daysAgo(5),
      },
      {
        title: "Performance audit",
        description: "Profile app startup time and reduce bundle size",
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.LOW,
        projectId: mobileProject.id,
        creatorId: admin.id,
        assigneeId: member.id,
        dueDate: daysFromNow(2),
      },
    ],
  });

  // Create tasks for API Integration
  await prisma.task.createMany({
    data: [
      {
        title: "Integrate Stripe payments",
        description: "Set up Stripe checkout for subscription billing",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.URGENT,
        projectId: apiProject.id,
        creatorId: member.id,
        assigneeId: admin.id,
        dueDate: daysFromNow(4),
      },
      {
        title: "Add Google Analytics tracking",
        description: "Implement GA4 event tracking across all pages",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        projectId: apiProject.id,
        creatorId: member.id,
        assigneeId: user3.id,
        dueDate: daysFromNow(12),
      },
      {
        title: "Build webhook handler",
        description: "Handle Stripe webhook events for payment status updates",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        projectId: apiProject.id,
        creatorId: member.id,
        assigneeId: admin.id,
        dueDate: daysFromNow(6),
      },
      {
        title: "Document API endpoints",
        description: "Create OpenAPI spec for all public endpoints",
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        projectId: apiProject.id,
        creatorId: member.id,
        assigneeId: user3.id,
        dueDate: daysAgo(4),
      },
    ],
  });

  console.log("Seed completed successfully!");
  console.log(`Created ${3} users, ${3} projects, ${15} tasks`);
  console.log("\nDemo credentials:");
  console.log("  admin@example.com / password123");
  console.log("  member@example.com / password123");
  console.log("  bob@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
