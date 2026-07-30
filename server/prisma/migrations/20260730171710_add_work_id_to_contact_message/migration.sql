-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "work_id" TEXT;

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
