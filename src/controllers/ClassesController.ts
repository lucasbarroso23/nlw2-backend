import { Request, Response } from 'express';

import convertHourToMinute from "../utils/convertHourToMinute";

import db from '../database/connection';

interface ScheduleItem {
    week_day: number;
    from: string;
    to: string;
}

export default class ClassesController {

    async index(request: Request, response: Response) {
        const filters = request.query;

        if (!filters.week_day || !filters.subject || !filters.time) {
            return response.status(400).json({
                error: 'Missing filters to search classes'
            })
        }

        const timeInMinutes = convertHourToMinute(filters.time as string);
    }


    async create(request: Request, response: Response) {

        const {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
        } = request.body;

        const trx = await db.transaction();

        try {
            const insertedUsersId = await trx('users').insert({
                name,
                avatar,
                whatsapp,
                bio,
            });

            const user_id = insertedUsersId[0];

            const insertedClassesId = await trx('classes').insert({
                subject,
                cost,
                user_id,
            });

            const class_id = insertedClassesId[0];

            const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
                return {
                    class_id,
                    week_day: scheduleItem.week_day,
                    from: convertHourToMinute(scheduleItem.from),
                    to: convertHourToMinute(scheduleItem.to),
                };
            })

            await trx('class_schedule').insert(classSchedule);

            await trx.commit();

            return response.status(201).send();

        } catch (err) {
            await trx.rollback();

            return response.status(400).json({
                error: 'Unexpected error while creating a new class'
            })
        }
    }
}