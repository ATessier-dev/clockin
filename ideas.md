## Clockin application for l'original

# Summary

Users and employee reference the same group of person.

This will be an application for employees working at gallerie l'original to use to consult their scheduled shifts, clockin and clockout from their shifts, access link to useful documentation and guides.

Each employee will have an id/code to acess the app and register their hours. Some permission will be granted to some users, depending on their role.

It will need a phone registry for a call dispatcher (but this feature is uncertain).

Users will be able to log their working hours preference and location.

This app will need to use a location module, to verify proximity of a workplace before allowing clockin and clockout.

A superuser will have acess to clockin and clokcout information to read and modify time worked.


# Modules

- database (schema) :
    - users : id, name (lastname), code, role/access-level
    - shift : id, user-id, date-start, date-end, time-start, time-end
    - schedule : date, shift-id (0..\*)

- REST :
    - GET : /users, /user/{id}, /user{name}, /shifts, /shift/{id}, /shift/{user-id}, schedule/{start-date, end-date}
    - POST : /user, /shift, /schedule{date}
    - UPDATE : /user/{id}, /shift/{id}, schedule/{shift-id}, schedule/{date}
    - DELETE : /user/{id}, shift/{id}, schedule/{shift-id}

- Frontend :
    - user-auth : a page where a user can login
    - dashboard : a page with useful information like : time worked, upcoming shift, clock-in, clock-out
    - schedule : a page where a user can see all shifts, personnal and for all users. Superuser can add, modify and delete on this page
    - links/doc : a page with useful links and documentation of the gallery
    - settings : a page where a user can add his availability, the language of the app, modify and see his personnal information

- Other :
    - store IP of clock-in clock-out to verify location of action
